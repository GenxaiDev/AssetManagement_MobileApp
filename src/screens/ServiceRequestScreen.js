import { useState, useEffect, useMemo, useRef } from "react";
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
import { spacing, radius, typography, darkTheme } from "../theme/colors";
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
  createServiceRequest,
} from "../api/request";
import { searchAsset } from "../api/asset";
import { z } from "zod";
import { useTheme } from "../context/ThemeContext";
import AppSidebar from "../components/AppSidebar";
import AppHeader from "../components/AppHeader";
import { tokenStorage } from "../utils/storage";
import NotificationModal from "../components/NotificationModal";
import { useNotifications } from "../context/NotificationContext";

const SIDEBAR_WIDTH = 260;

const schema = z
  .object({
    categoryId: z.coerce.number().nullable().optional(),
    priority: z.string().min(1, "Priority is required"),
    maintenanceType: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional(),
    providerType: z.enum(["OEM", "Vendor"]).optional(),
    serviceProviderId: z.coerce.number().nullable().optional(),
    serviceProviderName: z.string().optional(),
    assignedToUserId: z.coerce.number().nullable().optional(),
    assignedToName: z.string().optional(),
    requestedByUserId: z.coerce.number().nullable().optional(),
    requestedByName: z.string().optional(),
    requestedByPhone: z.string().optional(),
    requestedByEmail: z.string().optional(),
    clientId: z.coerce.number().nullable().optional(),
    locationId: z.coerce.number().nullable().optional(),
    assetId: z.coerce.number().nullable().optional(),
    issueRaisedOn: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.maintenanceType &&
        (data.assetId === undefined || data.assetId === null)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Affected Asset is required when Type is selected",
      path: ["assetId"],
    },
  );

import { useToast } from "../context/ToastContext";

export default function ServiceRequestScreen({ theme, navigation, route }) {
  const { isDark, toggleTheme, theme: contextTheme } = useTheme();
  const colors = contextTheme || darkTheme;
  const { showToast } = useToast();
  const asset = route?.params?.asset || null;
  const [assetDetail, setAssetDetail] = useState(asset || null);

  // ─── Reference data ────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [oems, setOems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingRefData, setLoadingRefData] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  // ─── Form state ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    categoryId: "",
    priority: "Medium",
    maintenanceType: "",
    subject: "",
    description: "",
    providerType: "OEM", // "OEM" | "Vendor"
    serviceProviderId: "",
    serviceProviderName: "",
    assignedToUserId: "",
    requestedByUserId: "",
    requestedByName: "",
    requestedByPhone: "",
    requestedByEmail: "",
    clientId: "",
    locationId: "",
    assetId: asset?.id || asset?.assetId || "",
    issueRaisedOn: new Date().toISOString().slice(0, 16),
  });

  // ─── User picker modal (shared between Raised By / Assigned To) ───────
  const [userModalTarget, setUserModalTarget] = useState(null); // "requestedBy" | "assignedTo" | null
  const [userSearch, setUserSearch] = useState("");

  // ─── Asset search modal (fallback when no Raised By user selected) ────
  const [showAssetSearch, setShowAssetSearch] = useState(false);
  const [assetSearchText, setAssetSearchText] = useState("");
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [assetSearchResults, setAssetSearchResults] = useState([]);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
   const [showNotifications, setShowNotifications] = useState(false);
   const { refreshUnreadCount } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const isAnimating = useRef(false);

  // ─── Load all reference data in parallel, but independently ────────────
  useEffect(() => {
    loadFormData();
    const loadAuth = async () => {
      const data = await tokenStorage.getAuthData();
      setAuthUser(data);
    };
    loadAuth();
   }, []);

   useEffect(() => {
     if (asset) {
      setForm((f) => ({ ...f, assetId: asset.assetId || "" }));
      setAssetDetail(asset);
      setAssetSearchText(asset.assetCode || asset.code || String(asset.assetId || ""));
    }
  }, [asset]);

  useEffect(() => {
    if (!authUser) return;
    const isLocationManager =
      authUser.roleName.toLowerCase() === "location manager";
    setForm((f) => ({
      ...f,
      assignedToUserId: isLocationManager
        ? ""
        : locations.find((l) => l.locationId === authUser?.locationId)
            ?.managerUserId || "",
      requestedByUserId: isLocationManager ? "" : authUser.userId || "",
      requestedByName: isLocationManager ? "" : authUser.fullName || "",
      requestedByPhone: isLocationManager ? "" : authUser.phone || "",
      requestedByEmail: isLocationManager ? "" : authUser.companyEmail || "",
    }));
  }, [authUser, locations]);

  const loadFormData = async () => {
    setLoadingRefData(true);
    const isLocationManager =
      authUser?.roleName?.toLowerCase() === "location manager";

    const results = await Promise.allSettled([
      getCategories("Service"),
      getAllLocations(),
      searchUsers({ employmentStatus: "Active" }),
      getAllAllocations({ allocationStatus: "Active" }),
      ...(isLocationManager
        ? [getAllClients(), getAllOems(), getAllVendors()]
        : []),
    ]);

    const catRes = results[0];
    const locRes = results[1];
    const userRes = results[2];
    const allocRes = results[3];
    const clientRes = isLocationManager ? results[4] : undefined;
    const oemRes = isLocationManager ? results[5] : undefined;
    const vendorRes = isLocationManager ? results[6] : undefined;

    const unwrap = (res) => {
      if (res.status !== "fulfilled") return [];
      const body = res.value?.data;
      return body?.data ?? body ?? [];
    };

    if (catRes.status === "fulfilled") setCategories(unwrap(catRes));
    else console.error("getCategories failed:", catRes.reason?.message);

    if (locRes.status === "fulfilled") setLocations(unwrap(locRes));
    else console.error("getAllLocations failed:", locRes.reason?.message);

    if (clientRes?.status === "fulfilled") setClients(unwrap(clientRes));
    else if (clientRes)
      console.error("getAllClients failed:", clientRes.reason?.message);

    if (userRes.status === "fulfilled") setUsers(unwrap(userRes));
    else console.error("searchUsers failed:", userRes.reason?.message);

    if (allocRes.status === "fulfilled") setAllocations(unwrap(allocRes));
    else console.error("getAllAllocations failed:", allocRes.reason?.message);

    if (oemRes?.status === "fulfilled") setOems(unwrap(oemRes));
    else if (oemRes)
      console.error("getAllOems failed:", oemRes.reason?.message);

    if (vendorRes?.status === "fulfilled") setVendors(unwrap(vendorRes));
    else if (vendorRes)
      console.error("getAllVendors failed:", vendorRes.reason?.message);

    setLoadingRefData(false);
  };

  // ─── Auto-fill priority from category default ──────────────────────────
  useEffect(() => {
    if (!form.categoryId) return;
    const cat = categories.find(
      (c) => String(c.categoryId) === String(form.categoryId),
    );
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
      .map((a) => ({
        assetId: a.assetId,
        assetCode: a.assetCode,
        assetName: a.assetName,
      }));
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

  // ─── User picker logic ──────────────────────────────────────────────────
  const openUserModal = (target) => {
    setUserModalTarget(target);
    setUserSearch("");
  };

  const handleUserSelect = (user) => {
    if (userModalTarget === "requestedBy") {
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
      const userAllocs = allocations.filter(
        (a) => Number(a.allocatedToUserId) === uid,
      );
      if (userAllocs.length > 0) {
        setForm((f) => ({
          ...f,
          clientId: userAllocs[0].clientId || f.clientId,
          locationId: userAllocs[0].locationId || f.locationId,
          assetId: userAllocs[0].assetId || f.assetId,
        }));
      }
    } else if (userModalTarget === "assignedTo") {
      setForm((f) => ({
        ...f,
        assignedToUserId: user.userId || user.id || "",
        assignedToName: user.fullName || user.name || "",
      }));
    }
    setUserModalTarget(null);
    setUserSearch("");
  };

  // ─── Service provider (OEM/Vendor) selection ───────────────────────────
  const providerOptions = form.providerType === "OEM" ? oems : vendors;

  const handleProviderTypeChange = (val) => {
    setForm((f) => ({
      ...f,
      providerType: val,
      serviceProviderId: "",
      serviceProviderName: "",
    }));
  };

  const handleProviderSelect = (id) => {
    const list = form.providerType === "OEM" ? oems : vendors;
    const found = list.find(
      (p) => String(p.oemId || p.vendorId) === String(id),
    );
    const name =
      form.providerType === "OEM" ? found?.oemName : found?.vendorName;
    setForm((f) => ({
      ...f,
      serviceProviderId: id,
      serviceProviderName: name || "",
    }));
  };

  // ─── Asset search (fallback, when no "Raised By" user is selected) ────
  const runAssetSearch = async (text) => {
    setAssetSearchText(text);
    
    // Clear selection if the search text is empty
    if (!text.trim()) {
      if (form.assetId) {
        updateForm("assetId", "");
        setAssetDetail(null);
      }
      setAssetSearchResults([]);
      return;
    }
    setAssetSearchLoading(true);
    try {
      const res = await searchAsset(text.trim(), { assetStatus: "In Stock,Allocated,Under Service,Handed Over" });
      console.log("res--------", res)
      const list = Array.isArray(res) ? res : res ? [res] : [];
      setAssetSearchResults(list);
    } catch (err) {
      setAssetSearchResults([]);
    } finally {
      setAssetSearchLoading(false);
    }
  };

  const selectSearchedAsset = (a) => {
    const code = a.assetCode || a.code || String(a.assetId || a.id);
    setAssetDetail(a);
    updateForm("assetId", a.assetId || a.id);
    setAssetSearchText(code);
    setAssetSearchResults([]);
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
        refreshUnreadCount();
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

   const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  // ─── Validation (lightweight, mirrors the web zod schema's key rules) ──
  const validate = () => {
    const newErrors = {};
    if (!form.priority) newErrors.priority = "Priority is required";
    if (!form.subject.trim()) newErrors.subject = "Subject is required";
    if (!form.requestedByName.trim())
      newErrors.requestedByName = "Requester name is required";
    if (form.maintenanceType && !form.assetId) {
      newErrors.assetId = "Affected Asset is required when Type is selected";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        requestType: "Service",
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        priority: form.priority,
        maintenanceType: form.maintenanceType || undefined,
        subject: form.subject,
        description: form.description || undefined,
        serviceProviderId: form.serviceProviderId
          ? Number(form.serviceProviderId)
          : null,
        serviceProviderName: form.serviceProviderName || undefined,
        assignedToUserId: form.assignedToUserId
          ? Number(form.assignedToUserId)
          : null,
        requestedByUserId: form.requestedByUserId
          ? Number(form.requestedByUserId)
          : null,
        requestedByName: form.requestedByName,
        requestedByPhone: form.requestedByPhone || undefined,
        requestedByEmail: form.requestedByEmail || undefined,
        clientId: form.clientId ? Number(form.clientId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
        assetId: form.assetId ? Number(form.assetId) : null,
        issueRaisedOn: form.issueRaisedOn || undefined,
      };
      await createServiceRequest(payload);
      showToast("Service request created successfully.", "success");
      navigation.goBack();
    } catch (err) {
      showToast(err.message || "Failed to create service request.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Service Request"
        subtitle="Raise a new service request for the scanned asset."
        colors={colors}
        onMenuPress={toggleSidebar}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md }}>
        {/* Request Details */}
        {/* Affected Asset */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Request Details
          </Text>
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
                    label="— Select Asset —"
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
          {/* <TouchableOpacity
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
                color: form.assetId ? colors.textPrimary : colors.placeholder,
                padding: 12,
              }}
            >
              {form.assetId
                ? assetDetail
                  ? assetDetail.assetCode ||
                    assetDetail.code ||
                    `#${form.assetId}`
                  : `#${form.assetId}`
                : "Search asset by code…"}
            </Text>
          </TouchableOpacity> */}
              <InputField
                placeholder="Asset code or QR data..."
                value={assetSearchText}
                onChangeText={runAssetSearch}
                theme={colors}
              />
              <ScrollView
                style={[{ maxHeight: 350, padding: spacing.md, marginBottom: spacing.md, marginTop: -8, backgroundColor: colors.inputBackground,
          borderColor: colors.inputBorder,
          borderWidth: 1.5, borderRadius: 12 }, assetSearchResults.length === 0 && { display: "none" }]}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {assetSearchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={String(item.assetId || item.id || idx)}
                    style={[
                      styles.userItem,
                      {
                        borderBottomColor: colors.cardBorder,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                      },
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
                        color:
                          item.assetStatus === "In Stock"
                            ? colors.accentGreen
                            : item.assetStatus === "Allocated"
                            ? colors.accentBlue
                            : item.assetStatus === "Under Repair" ||
                              item.assetStatus === "Under Service" ||
                              item.assetStatus === "Incident Reported"
                            ? colors.warning
                            : item.assetStatus === "Disposed"
                            ? colors.danger
                            : colors.textSecondary,
                        fontFamily: typography.fontBody,
                        fontSize: typography.small,
                      }}
                    >
                      {item.assetStatus}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
          {/* )} */}
          {errors.assetId && (
            <Text style={styles.errorText}>{errors.assetId}</Text>
          )}
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                CATEGORY
              </Text>
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
                  selectedValue={form.categoryId}
                  onValueChange={(val) => updateForm("categoryId", val)}
                  style={{ color: colors.textPrimary }}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="— Select Category —" value="" />
                  {categories.map((c) => (
                    <Picker.Item
                      key={c.categoryId}
                      label={c.categoryName}
                      value={String(c.categoryId)}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                PRIORITY *
              </Text>
              <View
                style={[
                  styles.pickerWrap,
                  {
                    borderColor: errors.priority
                      ? colors.danger
                      : colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
              >
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
            </View>
          </View>

          {/* <View style={styles.row}> */}
          {/* <View style={styles.fieldHalf}> */}
          <Text style={[styles.label, { color: colors.textMuted }]}>TYPE</Text>
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
              selectedValue={form.maintenanceType}
              onValueChange={(val) => updateForm("maintenanceType", val)}
              style={{ color: colors.textPrimary }}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="— Select Type —" value="" />
              {["Corrective", "Preventive", "AMC Visit", "Upgrade"].map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
          {/* </View>
            <View style={styles.fieldHalf}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                ISSUE RAISED ON
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerWrap,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                    justifyContent: "center",
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.textPrimary, padding: 12 }}>
                  {form.issueRaisedOn
                    ? form.issueRaisedOn.replace("T", " ")
                    : "Select date/time"}
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
                      const local = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16);
                      updateForm("issueRaisedOn", local);
                    }
                  }}
                />
              )}
            </View> */}
          {/* </View> */}

          <Text style={[styles.label, { color: colors.textMuted }]}>
            SUBJECT / TITLE *
          </Text>
          <InputField
            placeholder="e.g. Printer cartridge replacement needed"
            value={form.subject}
            onChangeText={(val) => updateForm("subject", val)}
            theme={colors}
            error={errors.subject}
          />
          {errors.subject && (
            <Text style={styles.errorText}>{errors.subject}</Text>
          )}

          <Text style={[styles.label, { color: colors.textMuted }]}>
            DESCRIPTION
          </Text>
          <View
            style={[
              styles.textareaContainer,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBackground,
              },
            ]}
          >
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

        {authUser?.roleName?.toLowerCase() === "location manager" && (
          <>
            {/* Service Provider */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Service Provider
              </Text>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    PROVIDER TYPE
                  </Text>
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

              <Text style={[styles.label, { color: colors.textMuted }]}>
                ASSIGNED TO
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerWrap,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                onPress={() => openUserModal("assignedTo")}
              >
                <Text
                  style={{
                    color: form.assignedToUserId
                      ? colors.textPrimary
                      : colors.placeholder,
                    padding: 12,
                  }}
                >
                  {form.assignedToName || "Search user…"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Raised By / Location */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Raised By / Location
              </Text>

              <Text style={[styles.label, { color: colors.textMuted }]}>
                RAISED BY (USER)
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerWrap,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                    marginBottom: spacing.sm,
                  },
                ]}
                onPress={() => openUserModal("requestedBy")}
              >
                <Text
                  style={{
                    color: form.requestedByUserId
                      ? colors.textPrimary
                      : colors.placeholder,
                    padding: 12,
                  }}
                >
                  {form.requestedByName
                    ? form.requestedByName
                    : "Search user by name or employee code…"}
                </Text>
              </TouchableOpacity>
              {errors.requestedByUserId && (
                <Text style={styles.errorText}>{errors.requestedByUserId}</Text>
              )}

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    NAME *
                  </Text>
                  <InputField
                    placeholder="Requester name"
                    value={form.requestedByName}
                    onChangeText={(val) => updateForm("requestedByName", val)}
                    theme={colors}
                  />
                  {errors.requestedByName && (
                    <Text style={styles.errorText}>
                      {errors.requestedByName}
                    </Text>
                  )}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    PHONE
                  </Text>
                  <InputField
                    placeholder="Phone number"
                    value={form.requestedByPhone}
                    onChangeText={(val) => updateForm("requestedByPhone", val)}
                    theme={colors}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textMuted }]}>
                EMAIL
              </Text>
              <InputField
                placeholder="Email address"
                value={form.requestedByEmail}
                onChangeText={(val) => updateForm("requestedByEmail", val)}
                theme={colors}
                keyboardType="email-address"
              />

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    CLIENT
                  </Text>
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
                      selectedValue={form.clientId}
                      onValueChange={(val) => updateForm("clientId", val)}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="— Select Client —" value="" />
                      {clients.map((c) => (
                        <Picker.Item
                          key={c.clientId}
                          label={c.clientName}
                          value={String(c.clientId)}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    LOCATION
                  </Text>
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
                      selectedValue={form.locationId}
                      onValueChange={(val) => updateForm("locationId", val)}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="— Select Location —" value="" />
                      {locations.map((l) => (
                        <Picker.Item
                          key={l.locationId}
                          label={l.locationName}
                          value={String(l.locationId)}
                        />
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

        {/* User picker modal (Raised By / Assigned To) */}
        <Modal visible={!!userModalTarget} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0,0,0,0.7)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  {userModalTarget === "assignedTo"
                    ? "Select Assignee"
                    : "Select User"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setUserModalTarget(null);
                    setUserSearch("");
                  }}
                >
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
                keyExtractor={(item, idx) =>
                  String(item.userId || item.id || idx)
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      { borderBottomColor: colors.cardBorder },
                    ]}
                    onPress={() => handleUserSelect(item)}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: typography.fontBodySemiBold,
                      }}
                    >
                      {item.fullName || item.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontFamily: typography.fontBody,
                        fontSize: typography.small,
                      }}
                    >
                      {item.employeeCode || ""}{" "}
                      {item.companyEmail || item.email || ""}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    style={{
                      color: colors.textMuted,
                      textAlign: "center",
                      marginVertical: spacing.md,
                    }}
                  >
                    {loadingRefData ? "Loading users…" : "No users found"}
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Asset search modal (fallback when no Raised By user set) */}
        <Modal visible={showAssetSearch} animationType="slide" transparent>
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: "rgba(0,0,0,0.7)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  Search Asset
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAssetSearch(false);
                    setAssetSearchText("");
                    setAssetSearchResults([]);
                  }}
                >
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
                keyExtractor={(item, idx) =>
                  String(item.assetId || item.id || idx)
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      {
                        borderBottomColor: colors.cardBorder,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      },
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
                  <Text
                    style={{
                      color: colors.textMuted,
                      textAlign: "center",
                      marginVertical: spacing.md,
                    }}
                  >
                    {assetSearchLoading
                      ? "Searching…"
                      : "Type to search for an asset"}
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeSidebar}
        />
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
        username={
          route?.params?.user?.name || route?.params?.user?.email || "User"
        }
        roleName={
          route?.params?.user?.roleName || route?.params?.user?.role || "User"
        }
        isDark={isDark}
        toggleTheme={toggleTheme}
        contextTheme={contextTheme}
        onNotificationPress={handleNotificationPress}
      />
      <NotificationModal
        visible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          refreshUnreadCount();
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
    // borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
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
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h3,
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
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    zIndex: 20,
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.cardBorder,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarTitle: {
    fontFamily: typography.fontHeading,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  sidebarCloseButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  sidebarMenu: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  sidebarIcon: {
    marginRight: spacing.md,
  },
  sidebarLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingVertical: spacing.md,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: typography.body,
  },
  userRole: {
    fontFamily: typography.fontBody,
    fontSize: typography.small,
    marginTop: 2,
  },
});
