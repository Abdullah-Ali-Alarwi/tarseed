import { supabase } from "@/lib/supabase";

// ========================================
// User Type
// ========================================

export interface User {
  id?: string;

  name: string;
  username: string;
  password?: string;
  email?: string;

  role: string;
  type: "platform" | "erp";

  companyId?: string;
  companyname?: string;

  ownerId?: string;

  status: string;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// SELECT FIELDS
// ========================================

const USER_FIELDS = `
  id,
  name,
  username,
  email,
  role,
  type,
  companyId,
  companyname,
  ownerId,
  status,
  isActive,
  createdAt,
  updatedAt
`;

// ========================================
// 1. Get All Users
// ========================================

export async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .order("createdAt", {
      ascending: false,
    });

  if (error) throw error;

  return data as User[];
}

// ========================================
// 2. Get User By ID
// ========================================

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as User;
}

// ========================================
// 3. Get User By Username
// ========================================

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;

  return data as User | null;
}

// ========================================
// 4. Get Users By Type
// ========================================

export async function getUsersByType(
  type: "platform" | "erp",
) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("type", type)
    .order("createdAt", {
      ascending: false,
    });

  if (error) throw error;

  return data as User[];
}

// ========================================
// 5. Get Users By Company
// ========================================

export async function getUsersByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("companyId", companyId)
    .order("createdAt", {
      ascending: false,
    });

  if (error) throw error;

  return data as User[];
}

// ========================================
// 6. Get Users By Role
// ========================================

export async function getUsersByRole(
  role: string,
  companyId?: string,
) {
  let query = supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("role", role);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as User[];
}

// ========================================
// 7. Get Active Users
// ========================================

export async function getActiveUsers(companyId?: string) {
  let query = supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("isActive", true)
    .eq("status", "active");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as User[];
}

// ========================================
// 8. Search Users
// ========================================

export async function searchUsers(search: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .or(
      `name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%,companyname.ilike.%${search}%`,
    )
    .order("createdAt", {
      ascending: false,
    });

  if (error) throw error;

  return data as User[];
}

// ========================================
// 9. Create User
// ========================================

export async function createUser(userData: User) {
  const { data, error } = await supabase
    .from("users")
    .insert(userData)
    .select(USER_FIELDS)
    .single();

  if (error) {
    console.error("Create user error:", error);
    throw new Error(error.message);
  }

  return data as User;
}

// ========================================
// 10. Update User
// ========================================

export async function updateUser(
  id: string,
  updates: Partial<User>,
) {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select(USER_FIELDS)
    .single();

  if (error) throw error;

  return data as User;
}

// ========================================
// 11. Delete User
// ========================================

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

// =====================================================
// TEMPORARY LOGIN AUTHENTICATION
// =====================================================

export async function authenticateUser(
  username: string,
  password: string,
) {
  const normalizedUsername = username
    .trim()
    .normalize("NFC")
    .toLocaleLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      username,
      password,
      email,
      role,
      type,
      companyId,
      companyname,
      status,
      isActive
    `)
    .ilike("username", normalizedUsername)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.password !== password) {
    return null;
  }

  const { password: _, ...user } = data;

  return {
    ...user,
    id: String(user.id),
  };
}