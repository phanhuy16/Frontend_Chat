import React, { useState } from "react";
import { userApi } from "../../api/user.api";
import { User } from "../../types/user.types";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../../utils/helpers";

interface ProfileEditorProps {
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user.avatar));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Upload avatar if changed
      let newAvatarUrl = user.avatar;
      if (selectedFile) {
        const avatarResult = await userApi.uploadAvatar(selectedFile);
        newAvatarUrl = avatarResult.avatarUrl;
        toast.success("Avatar uploaded successfully");
      }

      // Update profile
      if (displayName !== user.displayName || bio !== user.bio) {
        await userApi.updateProfile({
          displayName: displayName || user.displayName,
          bio: bio || undefined,
        });
        toast.success("Profile updated successfully");
      }

      onUpdate({
        displayName,
        bio,
        avatar: newAvatarUrl,
      });

      setSelectedFile(null);
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    displayName !== user.displayName ||
    bio !== (user.bio || "") ||
    selectedFile !== null;

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <img
            src={avatarPreview}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-white text-2xl">
              photo_camera
            </span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg">{user.displayName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click on avatar to upload new photo
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Max 5MB • JPG, PNG, GIF
          </p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          placeholder="Enter your name"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={150}
          className="w-full px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
          placeholder="Tell others about yourself..."
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
          {bio.length} / 150
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="flex-1 py-1.5 bg-primary text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-xs"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            "Save Changes"
          )}
        </button>
        <button
          onClick={() => {
            setDisplayName(user.displayName || "");
            setBio(user.bio || "");
            setAvatarPreview(getAvatarUrl(user.avatar));
            setSelectedFile(null);
          }}
          disabled={!hasChanges || isLoading}
          className="px-4 py-1.5 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-white/10 transition-all text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfileEditor;
