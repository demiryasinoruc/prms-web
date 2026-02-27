import api from "@/lib/axios"

export interface UserProfile {
  name: string
  surname: string
  email: string
  roleId: string | null
  roleName: string | null
}

export interface ProfileUpdateRequest {
  name: string
  surname: string
  email: string
}

export interface ChangePasswordRequest {
  password: string
  passwordConfirmation: string
}

export const profileApi = {
  getProfile: async () => {
    const response = await api.get<{
      name: string
      surname: string
      eMail: string
      roleId: string | null
      roleName: string | null
    }>("/user/profile")
    return {
      name: response.data.name,
      surname: response.data.surname,
      email: response.data.eMail,
      roleId: response.data.roleId,
      roleName: response.data.roleName,
    } as UserProfile
  },

  updateProfile: async (id: string, data: ProfileUpdateRequest, roleId: string) => {
    await api.put(`/user/${id}`, {
      Name: data.name,
      Surname: data.surname,
      EMail: data.email,
      RoleId: roleId,
    })
  },

  changePassword: async (data: ChangePasswordRequest) => {
    await api.post("/user/change-password", {
      Password: data.password,
      PasswordConfirmationm: data.passwordConfirmation,
    })
  },
}
