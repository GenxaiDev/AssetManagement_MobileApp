import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme, lightTheme } from "../theme/colors";
import { spacing, radius, typography } from "../theme/colors";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import {
  getCategories,
  getAllLocations,
  getAllClients,
  searchUsers,
  getAllAllocations,
} from "../api/request";
import { searchAsset } from "../api/asset";
import { createServiceRequest } from "../api/serviceRequest";
import { z } from "zod";
import { useTheme } from "../context/ThemeContext";

const schema = z.object({
  categoryId: z.coerce.number().nullable().optional(),
  priority: z.string().min(1, "Priority is required"),
  maintenanceType: z.string().optional(),
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
}).refine((data) => {
  if (data.maintenanceType && (data.assetId === undefined || data.assetId === null)) {
    return false;
  }
  return true;
}, {
  message: "Affected Asset is required when Type is selected",
  path: ["assetId"],
});

export default function ServiceRequestScreen({ theme, navigation, route }) {
  const colors = theme || darkTheme;
  const asset = route?.params?.asset || null;

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    categoryId: "",
    priority: "Medium",
    maintenanceType: "",
    subject: "",
    description: "",
    requestedByUserId: "",
    requestedByName: "",
    requestedByPhone: "",
    requestedByEmail: "",
    clientId: "",
    locationId: "",
    assetId: asset?.id || "",
    issueRaisedOn: new Date().toISOString().slice(0, 16),
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (asset) {
      setForm((f) => ({ ...f, assetId: asset.id || "" }));
    }
  }, [asset]);

  const loadFormData = async () => {
    try {
      const [catRes, locRes, clientRes, userRes, allocRes] = await Promise.all([
        getCategories("Service"),
        getAllLocations(),
        getAllClients(),
        searchUsers(),
        getAllAllocations({ allocationStatus: "Active" }),
      ]);
      setCategories(catRes.data || catRes.data?.data || []);
      setLocations(locRes.data || locRes.data?.data || []);
      setClients(clientRes.data || clientRes.data?.data || []);
      setUsers(userRes.data || userRes.data?.data || userRes.data || []);
      setAllocations(allocRes.data || allocRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load form data", err);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setForm((f) => ({
      ...f,
      requestedByUserId: user.userId || user.id || "",
      requestedByName: user.fullName || user.name || "",
      requestedByPhone: user.phone || "",
      requestedByEmail: user.companyEmail || user.email || "",
    }));
    setShowUserModal(false);
    setUserSearch("");
  };

  const userAssets = selectedUser
    ? allocations
        .filter((a) => Number(a.allocatedToUserId) === Number(selectedUser.userId || selectedUser.id) && a.assetId)
        .filter((a, i, self) => i === self.findIndex((x) => x.assetId === a.assetId))
        .map((a) => ({ assetId: a.assetId, assetCode: a.assetCode, assetName: a.assetName }))
    : [];

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
        requestType: "Service",
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        priority: form.priority,
        maintenanceType: form.maintenanceType || undefined,
        subject: form.subject,
        description: form.description || undefined,
        requestedByUserId: form.requestedByUserId ? Number(form.requestedByUserId) : null,
        requestedByName: form.requestedByName,
        requestedByPhone: form.requestedByPhone || undefined,
        requestedByEmail: form.requestedByEmail || undefined,
        clientId: form.clientId ? Number(form.clientId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
        assetId: form.assetId ? Number(form.assetId) : null,
        issueRaisedOn: form.issueRaisedOn || undefined,
      };
      await createServiceRequest(payload);
      Alert.alert("Success", "Service request created.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create service request.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.collapseButton}>
          <Ionicons name="menu" size={24} color={colors.accentBlue} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Service Request</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Raise a new service request for the scanned asset.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Request Details</Text>

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
            <View style={[styles.pickerWrap, { borderColor: errors.categoryId ? colors.danger : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
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
            <View style={[styles.pickerWrap, { borderColor: errors.priority ? colors.danger : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
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

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={[styles.label, { color: colors.textMuted }]}>TYPE</Text>
            <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
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
          </View>
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
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>SUBJECT / TITLE *</Text>
        <InputField
          placeholder="e.g. Printer cartridge replacement needed"
          value={form.subject}
          onChangeText={(val) => updateForm("subject", val)}
          theme={colors}
          error={errors.subject}
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

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Raised By / Location</Text>

        <TouchableOpacity
          style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, marginBottom: spacing.sm }]}
          onPress={() => setShowUserModal(true)}
        >
          <Text style={{ color: form.requestedByUserId ? colors.textPrimary : colors.placeholder, padding: 12 }}>
            {selectedUser ? `${selectedUser.fullName || selectedUser.name} (${selectedUser.employeeCode || "User"})` : "Search user by name or employee code…"}
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

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Asset Information</Text>
        <InputField
          icon="cube-outline"
          placeholder="Asset"
          value={
            asset
              ? asset.assetCode || asset.code || asset.name || `#${asset.id}`
              : form.assetId
                ? `#${form.assetId}`
                : ""
          }
          onChangeText={() => {}}
          editable={false}
          theme={colors}
        />
        {errors.assetId && <Text style={styles.errorText}>{errors.assetId}</Text>}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Submit Request"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>

      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select User</Text>
              <TouchableOpacity onPress={() => { setShowUserModal(false); setUserSearch(""); }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18 }}>✕</Text>
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
                  No users found
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
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
});
