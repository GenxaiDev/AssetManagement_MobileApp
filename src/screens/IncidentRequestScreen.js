import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme, spacing, radius, typography } from "../theme/colors";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import {
  getCategories,
  getAllLocations,
  getAllClients,
  searchUsers,
  getAllAllocations,
  getAllOems,
  getAllVendors,
  createIncidentRequest,
} from "../api/request";
import { searchAsset } from "../api/asset";
import { getUnreadNotificationCount } from "../api/notification";
import { z } from "zod";
import { useTheme } from "../context/ThemeContext";
import AppSidebar from "../components/AppSidebar";
import AppHeader from "../components/AppHeader";
import { tokenStorage } from "../utils/storage";
import NotificationModal from "../components/NotificationModal";
import { signalRService } from "../services/signalRService";


const SIDEBAR_WIDTH = 260;

const schema = z.object({
  categoryId: z.coerce.number().nullable().optional(),
  priority: z.string().min(1, "Priority is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  requestedByUserId: z.coerce.number().nullable().optional(),
  requestedByName: z.string().min(1, "Requester name is required"),
  requestedByPhone: z.string().optional(),
  requestedByEmail: z.string().optional(),
  clientId: z.coerce.number().nullable().optional(),
  locationId: z.coerce.number().nullable().optional(),
  assetId: z.coerce.number().nullable().optional(),
  issueRaisedOn: z.string().optional(),
});

export default function IncidentRequestScreen({ navigation, route }) {
  const { isDark, toggleTheme, theme } = useTheme();
  const colors = theme;
  const asset = route?.params?.asset || null;
  const [assetDetail, setAssetDetail] = useState(asset || null);

  // ─── Reference data ────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [oems, setOems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingRefData, setLoadingRefData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [authUser, setAuthUser] = useState(null);

  const [form, setForm] = useState({
    categoryId: "",
    priority: "Medium",
    subject: "",
    description: "",
    providerType: "OEM", // "OEM" | "Vendor" — Incident has provider section, no Assigned To (matches web)
    serviceProviderId: "",
    serviceProviderName: "",
    requestedByUserId: "",
    requestedByName: "",
    requestedByPhone: "",
    requestedByEmail: "",
    clientId: "",
    locationId: "",
    assetId: asset?.id || asset?.assetId || "",
    issueRaisedOn: new Date().toISOString().slice(0, 16),
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ─── Asset search modal (fallback when no Raised By user selected) ────
  const [showAssetSearch, setShowAssetSearch] = useState(false);
  const [assetSearchText, setAssetSearchText] = useState("");
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [assetSearchResults, setAssetSearchResults] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    loadFormData();
    const loadAuth = async () => {
      const data = await tokenStorage.getAuthData();
      setAuthUser(data);
    };
    loadAuth();
  }, []);

  useEffect(() => {
    const handler = (data) => {
      console.log("📬 SeedStatus:", data);
      const message = data.message || `${data.type} ${data.status}`;
      onShowToast?.({ message, suppressGeneric: !!data.nofUnread });
      if (data.nofUnread !== undefined) {
        setUnreadCount(data.nofUnread);
      }
    };
    signalRService.on("ReceiveNotification", handler);
    return () => {
      signalRService.off("ReceiveNotification", handler);
    };
  }, []);

  useEffect(() => {
    if (asset) {
      setForm((f) => ({ ...f, assetId: asset.id || asset.assetId || "" }));
      setAssetDetail(asset);
    }
  }, [asset]);

  useEffect(() => {
    if (!authUser) return;
    setForm((f) => ({
      ...f,
      requestedByUserId: authUser.userId || "",
      requestedByName: authUser.fullName || "",
      requestedByPhone: authUser.phone || "",
      requestedByEmail: authUser.companyEmail || "",
    }));
  }, [authUser]);

  const loadFormData = async () => {
    setLoadingRefData(true);
    const isLocationManager =
      authUser?.roleName?.toLowerCase() === "location manager";

    const results = await Promise.allSettled([
      getCategories("Incident"),
      getAllLocations(),
      searchUsers({ employmentStatus: "Active" }),
      getAllAllocations({ allocationStatus: "Active" }),
      ...(isLocationManager
        ? [getAllOems(), getAllVendors(), getAllClients()]
        : []),
    ]);

    const catRes = results[0];
    const locRes = results[1];
    const userRes = results[2];
    const allocRes = results[3];
    const oemRes = isLocationManager ? results[4] : undefined;
    const vendorRes = isLocationManager ? results[5] : undefined;
    const clientRes = isLocationManager ? results[6] : undefined;

    // Unwraps a settled result, checking BOTH layers:
    // 1. catRes.status — did the HTTP call itself resolve? ("fulfilled"/"rejected", from Promise.allSettled)
    // 2. body.success — did the backend's own business logic succeed? (from your ApiResponse<T> shape)
    const unwrap = (res, label) => {
      if (res.status !== "fulfilled") {
        console.error(`${label} request failed:`, res.reason?.message || res.reason);
        return [];
      }
      const body = res.value?.data; // ApiResponse<T> = { success, message, data }
      if (body && body.success === false) {
        console.error(`${label} backend reported failure:`, body.message);
        return [];
      }
      return body?.data ?? body ?? [];
    };

    setCategories(unwrap(catRes, "getCategories"));
    setLocations(unwrap(locRes, "getAllLocations"));
    setUsers(unwrap(userRes, "searchUsers"));
    setAllocations(unwrap(allocRes, "getAllAllocations"));

    if (oemRes?.status === "fulfilled") setOems(unwrap(oemRes, "getAllOems"));
    else if (oemRes)
      console.error("getAllOems failed:", oemRes.reason?.message || oemRes);

    if (vendorRes?.status === "fulfilled")
      setVendors(unwrap(vendorRes, "getAllVendors"));
    else if (vendorRes)
      console.error(
        "getAllVendors failed:",
        vendorRes.reason?.message || vendorRes
      );

    if (clientRes?.status === "fulfilled")
      setClients(unwrap(clientRes, "getAllClients"));
    else if (clientRes)
      console.error(
        "getAllClients failed:",
        clientRes.reason?.message || clientRes
      );

    setLoadingRefData(false);
  };

  // ─── Auto-fill priority from category default ──────────────────────────
  useEffect(() => {
    if (!form.categoryId) return;
    const cat = categories.find((c) => String(c.categoryId) === String(form.categoryId));
    if (cat?.defaultPriority) {
      setForm((f) => ({ ...f, priority: cat.defaultPriority }));
    }
  }, [form.categoryId, categories]);

  // ─── Assets currently allocated to the selected "Raised By" user ──────
  const userAssets = useMemo(() => {
    if (!form.requestedByUserId) return [];
    const uid = Number(form.requestedByUserId);
    const seen = new Set();
    return allocations
      .filter((a) => Number(a.allocatedToUserId) === uid && a.assetId)
      .filter((a) => {
        if (seen.has(a.assetId)) return false;
        seen.add(a.assetId);
        return true;
      })
      .map((a) => ({ assetId: a.assetId, assetCode: a.assetCode, assetName: a.assetName }));
  }, [allocations, form.requestedByUserId]);

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  const handleUserSelect = (user) => {
    setForm((f) => ({
      ...f,
      requestedByUserId: user.userId || user.id || "",
      requestedByName: user.fullName || user.name || "",
      requestedByPhone: user.phone || "",
      requestedByEmail: user.companyEmail || user.email || "",
      assetId: "", // reset asset when requester changes, same as web
    }));

    // Auto-fill client/location/asset from this user's first active allocation
    const uid = Number(user.userId || user.id);
    const userAllocs = allocations.filter((a) => Number(a.allocatedToUserId) === uid);
    if (userAllocs.length > 0) {
      setForm((f) => ({
        ...f,
        clientId: userAllocs[0].clientId || f.clientId,
        locationId: userAllocs[0].locationId || f.locationId,
        assetId: userAllocs[0].assetId || f.assetId,
      }));
    }

    setShowUserModal(false);
    setUserSearch("");
  };

  // ─── Service provider (OEM/Vendor) selection ───────────────────────────
  const providerOptions = form.providerType === "OEM" ? oems : vendors;

  const handleProviderTypeChange = (val) => {
    setForm((f) => ({ ...f, providerType: val, serviceProviderId: "", serviceProviderName: "" }));
  };

  const handleProviderSelect = (id) => {
    const list = form.providerType === "OEM" ? oems : vendors;
    const found = list.find((p) => String(p.oemId || p.vendorId) === String(id));
    const name = form.providerType === "OEM" ? found?.oemName : found?.vendorName;
    setForm((f) => ({ ...f, serviceProviderId: id, serviceProviderName: name || "" }));
  };

  // ─── Asset search (fallback, when no "Raised By" user is selected) ────
  const runAssetSearch = async (text) => {
    setAssetSearchText(text);
    if (!text.trim()) {
      setAssetSearchResults([]);
      return;
    }
    setAssetSearchLoading(true);
    try {
      const res = await searchAsset(text.trim());
      const list = Array.isArray(res) ? res : res ? [res] : [];
      setAssetSearchResults(list);
    } catch (err) {
      setAssetSearchResults([]);
    } finally {
      setAssetSearchLoading(false);
    }
  };

  const selectSearchedAsset = (a) => {
    setAssetDetail(a);
    updateForm("assetId", a.assetId || a.id);
    setShowAssetSearch(false);
    setAssetSearchText("");
    setAssetSearchResults([]);
  };

  const validate = () => {
    try {
      schema.parse(form);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((e) => {
          newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        priority: form.priority,
        subject: form.subject,
        description: form.description || undefined,
        serviceProviderId: form.serviceProviderId ? Number(form.serviceProviderId) : null,
        serviceProviderName: form.serviceProviderName || undefined,
        requestedByUserId: form.requestedByUserId ? Number(form.requestedByUserId) : null,
        requestedByName: form.requestedByName,
        requestedByPhone: form.requestedByPhone || undefined,
        requestedByEmail: form.requestedByEmail || undefined,
        clientId: form.clientId ? Number(form.clientId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
        assetId: form.assetId ? Number(form.assetId) : null,
        issueRaisedOn: form.issueRaisedOn || undefined,
      };
      await createIncidentRequest(payload);
      Alert.alert("Success", "Incident request created.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create incident request.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    if (isAnimating.current) return;
    const toValue = sidebarOpen ? -SIDEBAR_WIDTH : 0;
    isAnimating.current = true;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(!sidebarOpen);
      isAnimating.current = false;
      if (!sidebarOpen) {
        loadUnreadCount();
      }
    });
  };

  const closeSidebar = () => {
    if (isAnimating.current) return;
    if (!sidebarOpen) return;
    isAnimating.current = true;
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(false);
      isAnimating.current = false;
    });
  };

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("Unread count fetch failed:", err);
    }
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Incident Request"
        subtitle="Report an incident for the scanned asset."
        colors={colors}
        onMenuPress={toggleSidebar}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>

        {/* <View style={[styles.slaBanner, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }]}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={[styles.slaText, { color: "#EF4444" }]}>
            <Text style={{ fontWeight: "700" }}>SLA clock starts immediately.</Text> Issue raised date/time is auto-set to now. Response and resolution deadlines are calculated based on priority.
          </Text>
        </View> */}

        {/* Request Details */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Request Details</Text>
          {/* Affected Asset — same conditional pattern as web: allocation dropdown if a
            Raised By user is selected, otherwise a free asset search */}
          <Text style={[styles.label, { color: colors.textMuted }]}>
                        Affected Asset (optional)
                      </Text>
          
                      {/* {form.requestedByUserId ? (
                        <View
                          style={[
                            styles.pickerWrap,
                            {
                              borderColor: colors.inputBorder,
                              backgroundColor: colors.inputBackground,
                            },
                          ]}
                        >
                          <Picker
                            selectedValue={form.assetId}
                            onValueChange={(val) => updateForm("assetId", val)}
                            style={{ color: colors.textPrimary }}
                            dropdownIconColor={colors.textPrimary}
                          >
                            <Picker.Item
                              label={
                                userAssets.length
                                  ? "— Select Asset —"
                                  : "— No assets allocated to this user —"
                              }
                              value=""
                            />
                            {userAssets.map((a) => (
                              <Picker.Item
                                key={a.assetId}
                                label={
                                  a.assetName
                                    ? `${a.assetCode} — ${a.assetName}`
                                    : a.assetCode
                                }
                                value={String(a.assetId)}
                              />
                            ))}
                          </Picker>
                        </View>
                      ) : ( */}
                        <TouchableOpacity
                          style={[
                            styles.pickerWrap,
                            {
                              borderColor: colors.inputBorder,
                              backgroundColor: colors.inputBackground,
                            },
                          ]}
                          onPress={() => setShowAssetSearch(true)}
                        >
                          <Text
                            style={{
                              color: form.assetId
                                ? colors.textPrimary
                                : colors.placeholder,
                              padding: 12,
                            }}
                          >
                            {form.assetId
                              ? assetDetail
                                ? assetDetail.assetCode || assetDetail.code || `#${form.assetId}`
                                : `#${form.assetId}`
                              : "Search asset by code…"}
                          </Text>
                        </TouchableOpacity>
                      {/* )} */}
                      {errors.assetId && (
                        <Text style={styles.errorText}>{errors.assetId}</Text>
                      )}
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
              <View style={[styles.pickerWrap, { borderColor: errors.categoryId ? "#EF4444" : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <Picker
                  selectedValue={form.categoryId}
                  onValueChange={(val) => updateForm("categoryId", val)}
                  style={{ color: colors.textPrimary }}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="— Select Category —" value="" />
                  {categories.map((c) => (
                    <Picker.Item key={c.categoryId} label={c.categoryName} value={String(c.categoryId)} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>PRIORITY *</Text>
              <View style={[styles.pickerWrap, { borderColor: errors.priority ? "#EF4444" : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <Picker
                  selectedValue={form.priority}
                  onValueChange={(val) => updateForm("priority", val)}
                  style={{ color: colors.textPrimary }}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="— Select Priority —" value="" />
                  {["Critical", "High", "Medium", "Low"].map((p) => (
                    <Picker.Item key={p} label={p} value={p} />
                  ))}
                </Picker>
              </View>
              {errors.priority && <Text style={styles.errorText}>{errors.priority}</Text>}
            </View>
          </View>

          {/* <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>ISSUE RAISED ON</Text>
              <TouchableOpacity
                style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, justifyContent: "center" }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.textPrimary, padding: 12 }}>
                  {form.issueRaisedOn ? form.issueRaisedOn.replace("T", " ") : "Select date/time"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(form.issueRaisedOn || Date.now())}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                      updateForm("issueRaisedOn", local);
                    }
                  }}
                />
              )}
            </View>
            <View style={styles.fieldHalf} />
          </View> */}

          <Text style={[styles.label, { color: colors.textMuted }]}>SUBJECT / TITLE *</Text>
          <InputField
            placeholder="e.g. Printer not working at Ajmer Depot"
            value={form.subject}
            onChangeText={(val) => updateForm("subject", val)}
            theme={colors}
          />
          {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}

          <Text style={[styles.label, { color: colors.textMuted }]}>DESCRIPTION</Text>
          <View style={[styles.textareaContainer, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.textarea, { color: colors.textPrimary }]}
              placeholder="Detailed description of the issue or request..."
              placeholderTextColor={colors.placeholder}
              value={form.description}
              onChangeText={(val) => updateForm("description", val)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {authUser?.roleName?.toLowerCase() === 'location manager' && (
          <>
            {/* Service Provider — same as web: Incident shows Provider Type + Provider, but NOT Assigned To */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Provider</Text>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>PROVIDER TYPE</Text>
                  <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <Picker
                      selectedValue={form.providerType}
                      onValueChange={handleProviderTypeChange}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="OEM" value="OEM" />
                      <Picker.Item label="Vendor" value="Vendor" />
                    </Picker>
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    {form.providerType === "OEM" ? "OEM" : "VENDOR"}
                  </Text>
                  <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <Picker
                      selectedValue={form.serviceProviderId}
                      onValueChange={handleProviderSelect}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="— Select —" value="" />
                      {providerOptions.map((p) => (
                        <Picker.Item
                          key={p.oemId || p.vendorId}
                          label={p.oemName || p.vendorName}
                          value={String(p.oemId || p.vendorId)}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Raised By / Location */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Raised By / Location</Text>

              <TouchableOpacity
                style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, marginBottom: spacing.sm }]}
                onPress={() => setShowUserModal(true)}
              >
                <Text style={{ color: form.requestedByUserId ? colors.textPrimary : colors.placeholder, padding: 12 }}>
                  {form.requestedByName ? form.requestedByName : "Search user by name or employee code…"}
                </Text>
              </TouchableOpacity>
              {errors.requestedByUserId && <Text style={styles.errorText}>{errors.requestedByUserId}</Text>}

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>NAME *</Text>
                  <InputField
                    placeholder="Requester name"
                    value={form.requestedByName}
                    onChangeText={(val) => updateForm("requestedByName", val)}
                    theme={colors}
                  />
                  {errors.requestedByName && <Text style={styles.errorText}>{errors.requestedByName}</Text>}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>PHONE</Text>
                  <InputField
                    placeholder="Phone number"
                    value={form.requestedByPhone}
                    onChangeText={(val) => updateForm("requestedByPhone", val)}
                    theme={colors}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <InputField
                placeholder="Email address"
                value={form.requestedByEmail}
                onChangeText={(val) => updateForm("requestedByEmail", val)}
                theme={colors}
                keyboardType="email-address"
              />

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>CLIENT</Text>
                  <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <Picker
                      selectedValue={form.clientId}
                      onValueChange={(val) => updateForm("clientId", val)}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="— Select Client —" value="" />
                      {clients.map((c) => (
                        <Picker.Item key={c.clientId} label={c.clientName} value={String(c.clientId)} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>LOCATION</Text>
                  <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <Picker
                      selectedValue={form.locationId}
                      onValueChange={(val) => updateForm("locationId", val)}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="— Select Location —" value="" />
                      {locations.map((l) => (
                        <Picker.Item key={l.locationId} label={l.locationName} value={String(l.locationId)} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}


        <View style={styles.footer}>
          <PrimaryButton
            title="Submit Request"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* User picker modal */}
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select User</Text>
              <TouchableOpacity onPress={() => { setShowUserModal(false); setUserSearch(""); }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <InputField
              placeholder="Search by name or employee code..."
              value={userSearch}
              onChangeText={setUserSearch}
              theme={colors}
            />
            <FlatList
              data={users.filter((u) => {
                const term = userSearch.toLowerCase();
                return (
                  (u.fullName || u.name || "").toLowerCase().includes(term) ||
                  (u.employeeCode || "").toLowerCase().includes(term)
                );
              })}
              keyExtractor={(item, idx) => String(item.userId || item.id || idx)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.userItem, { borderBottomColor: colors.cardBorder }]}
                  onPress={() => handleUserSelect(item)}
                >
                  <Text style={{ color: colors.textPrimary, fontFamily: typography.fontBodySemiBold }}>
                    {item.fullName || item.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: typography.small }}>
                    {item.employeeCode || ""} {item.companyEmail || item.email || ""}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: "center", marginVertical: spacing.md }}>
                  {loadingRefData ? "Loading users…" : "No users found"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Asset search modal (fallback when no Raised By user set) */}
      <Modal visible={showAssetSearch} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Search Asset</Text>
              <TouchableOpacity onPress={() => { setShowAssetSearch(false); setAssetSearchText(""); setAssetSearchResults([]); }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <InputField
              placeholder="Asset code or QR data..."
              value={assetSearchText}
              onChangeText={runAssetSearch}
              theme={colors}
            />
            <FlatList
              data={assetSearchResults}
              keyExtractor={(item, idx) => String(item.assetId || item.id || idx)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.userItem,
                    { borderBottomColor: colors.cardBorder, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                  ]}
                  onPress={() => selectSearchedAsset(item)}
                >
                  <View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: typography.fontBodySemiBold,
                      }}
                    >
                      {item.assetCode ||
                        item.code ||
                        `#${item.assetId || item.id}`}
                    </Text>
                    {!!item.assetTypeName && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: typography.fontBody,
                          fontSize: typography.small,
                        }}
                      >
                        {item.assetTypeName}
                      </Text>
                    )}
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontFamily: typography.fontBody,
                        fontSize: typography.small,
                      }}
                    >
                      {item.assetStatus}
                    </Text>
                  </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: "center", marginVertical: spacing.md }}>
                  {assetSearchLoading ? "Searching…" : "Type to search for an asset"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {sidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSidebar} />
      )}
      <AppSidebar
        colors={colors}
        sidebarOpen={sidebarOpen}
        slideAnim={slideAnim}
        isAnimating={isAnimating}
        toggleSidebar={toggleSidebar}
        closeSidebar={closeSidebar}
        navigation={navigation}
        route={route}
        username={route?.params?.user?.name || route?.params?.user?.email || "User"}
        roleName={route?.params?.user?.roleName || route?.params?.user?.role || "User"}
        isDark={isDark}
        toggleTheme={toggleTheme}
        contextTheme={theme}
      onNotificationPress={handleNotificationPress}
        unreadCount={unreadCount}
      />
      <NotificationModal
        visible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          loadUnreadCount();
        }}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  collapseButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
  },
  slaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  slaText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    lineHeight: 18,
  },
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.tiny,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  pickerWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  textareaContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 100,
    marginBottom: spacing.sm,
  },
  textarea: {
    fontFamily: typography.fontBody,
    fontSize: typography.body,
    flex: 1,
    minHeight: 80,
  },
  errorText: {
    color: "#EF4444",
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: 0,
    marginBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  userItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
});