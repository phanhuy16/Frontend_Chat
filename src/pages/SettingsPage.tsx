import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../api/user.api";
import toast from "react-hot-toast";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Modal } from "antd";

const { confirm } = Modal;

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    bio: "",
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      userApi
        .uploadAvatar(file)
        .then((data) => {
          setAvatarPreview(data.avatarUrl);
          toast.success("Ảnh đại diện đã được cập nhật!");
        })
        .catch((err) => {
          console.error("Avatar upload error:", err);
          toast.error("Lỗi khi tải ảnh lên");
        });
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // TODO: Call API to update user profile
      await userApi.updateProfile(formData);
      setMessage("Thay đổi đã được lưu thành công!");
      toast.success("Thay đổi đã được lưu thành công!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Lỗi khi lưu thay đổi");
      toast.error("Lỗi khi lưu thay đổi");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword) {
      setError("Vui lòng nhập cả mật khẩu hiện tại và mật khẩu mới");
      toast.error("Vui lòng nhập cả mật khẩu hiện tại và mật khẩu mới");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // TODO: Call API to change password
      await userApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setMessage("Mật khẩu đã được thay đổi thành công!");
      toast.success("Mật khẩu đã được thay đổi thành công!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Lỗi khi thay đổi mật khẩu");
      toast.error("Lỗi khi thay đổi mật khẩu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    confirm({
      title: "Xác nhận xóa tài khoản",
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: `Bạn chắc chứ? Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.`,
      onOk: async () => {
        setLoading(true);
        try {
          await userApi.deleteAccount();
          toast.success("Tài khoản của bạn đã bị xóa.");
          await logout();
          window.location.href = "/auth";
        } catch (err) {
          setError("Lỗi khi xóa tài khoản");
          toast.error("Lỗi khi xóa tài khoản");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth";
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
      {/* SideNavBar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 dark:border-white/10 bg-white/50 dark:bg-background-dark/50 p-4">
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-4">
            {/* User Info */}
            <div className="flex gap-3 items-center">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{ backgroundImage: `url("${user?.avatar || ""}")` }}
              />
              <div className="flex flex-col">
                <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                  {user?.displayName}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 mt-4">
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary cursor-pointer"
                href="#profile"
              >
                <span className="material-symbols-outlined text-2xl">
                  person
                </span>
                <p className="text-sm font-medium leading-normal">
                  Hồ sơ & Tài khoản
                </p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                href="#notifications"
              >
                <span className="material-symbols-outlined text-2xl">
                  notifications
                </span>
                <p className="text-sm font-medium leading-normal">Thông báo</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                href="#privacy"
              >
                <span className="material-symbols-outlined text-2xl">lock</span>
                <p className="text-sm font-medium leading-normal">
                  Quyền riêng tư & Bảo mật
                </p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                href="#theme"
              >
                <span className="material-symbols-outlined text-2xl">
                  palette
                </span>
                <p className="text-sm font-medium leading-normal">Giao diện</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                href="#help"
              >
                <span className="material-symbols-outlined text-2xl">help</span>
                <p className="text-sm font-medium leading-normal">
                  Trợ giúp & Phản hồi
                </p>
              </a>
            </nav>
          </div>

          {/* Logout Button */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
              <p className="text-sm font-medium leading-normal">Đăng xuất</p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 mx-auto max-w-4xl">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 mb-8">
            <div className="flex min-w-72 flex-col gap-2">
              <h1 className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                Hồ sơ & Tài khoản
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                Quản lý thông tin cá nhân và tài khoản của bạn.
              </p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Profile Header */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-background-dark/50 mb-8">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex gap-4 items-center">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24"
                  style={{
                    backgroundImage: `url("${
                      avatarPreview || user?.avatar || ""
                    }")`,
                  }}
                />
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    {user?.displayName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal mt-1">
                    Cập nhật ảnh và chi tiết cá nhân của bạn.
                  </p>
                </div>
              </div>
              <label className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] w-full sm:w-auto hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <span className="truncate">Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Inputs */}
          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name */}
              <div className="flex flex-col">
                <label
                  className="text-gray-800 dark:text-white text-base font-medium leading-normal pb-2"
                  htmlFor="displayName"
                >
                  Tên hiển thị
                </label>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-background-light dark:bg-background-dark focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                  id="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label
                  className="text-gray-800 dark:text-white text-base font-medium leading-normal pb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-background-light dark:bg-background-dark focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>

            {/* Bio */}
            <div className="flex flex-col">
              <label
                className="text-gray-800 dark:text-white text-base font-medium leading-normal pb-2"
                htmlFor="bio"
              >
                Tiểu sử ngắn
              </label>
              <textarea
                className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-background-light dark:bg-background-dark focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Giới thiệu về bạn..."
              />
            </div>

            {/* Divider */}
            <hr className="border-t border-gray-200 dark:border-white/10 my-8" />

            {/* Change Password Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Đổi mật khẩu
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Để bảo mật, vui lòng nhập mật khẩu hiện tại của bạn để thay đổi.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label
                    className="text-gray-800 dark:text-white text-base font-medium leading-normal pb-2"
                    htmlFor="currentPassword"
                  >
                    Mật khẩu hiện tại
                  </label>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-background-light dark:bg-background-dark focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                    id="currentPassword"
                    placeholder="••••••••"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    className="text-gray-800 dark:text-white text-base font-medium leading-normal pb-2"
                    htmlFor="newPassword"
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-background-light dark:bg-background-dark focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal"
                    id="newPassword"
                    placeholder="••••••••"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={loading}
                className="mt-4 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <span className="truncate">
                  {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </span>
              </button>
            </div>

            {/* Divider */}
            <hr className="border-t border-gray-200 dark:border-white/10 my-8" />

            {/* Delete Account Section */}
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-500">
                Xóa tài khoản
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                Một khi bạn xóa tài khoản, sẽ không có cách nào để khôi phục.
                Vui lòng cân nhắc kỹ.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-600/10 text-red-600 dark:bg-red-500/10 dark:text-red-500 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-red-600/20 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                <span className="truncate">
                  {loading ? "Đang xử lý..." : "Tôi muốn xóa tài khoản"}
                </span>
              </button>
            </div>
          </form>

          {/* Action Buttons Footer */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              <span className="truncate">Hủy</span>
            </button>
            <button
              form="settings-form"
              onClick={handleSaveChanges}
              disabled={loading}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <span className="truncate">
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
