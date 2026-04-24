"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { ModalOverlay, ModalPanel, UserAvatar } from "../ui";
import { CloseIcon, UserIcon, CameraIcon } from "../icons";
import { updateProfile } from "@/actions/user";
import toast from "react-hot-toast";

export default function ProfileModal({ isOpen, onClose, user }) {
  const { update } = useSession();
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        image,
      });

      if (res.success) {
        // Cập nhật session client ngay lập tức
        await update({ name: name.trim(), image });

        toast.success("Cập nhật hồ sơ thành công!");
        onClose();
      } else {
        toast.error(res.error || "Lỗi khi cập nhật");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi không xác định");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay onClose={onClose}>
          <ModalPanel className="max-w-[450px]">
            <div className="flex justify-between items-center p-6 border-b border-border-subtle">
              <h2 className="text-xl font-bold text-text-main">
                Hồ sơ cá nhân
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <UserAvatar
                    name={user?.name || user?.username}
                    image={image}
                    size="xl"
                    isActive={true}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-primary hover:bg-blue-50 transition-all scale-90 group-hover:scale-100"
                  >
                    <CameraIcon size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-3 uppercase font-bold tracking-wider">
                  Ảnh đại diện
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-main">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-3 py-2 rounded border-2 border-border-subtle focus:border-primary focus:outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-main opacity-50">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className="w-full px-3 py-2 rounded border-2 border-border-subtle bg-gray-50 text-text-muted text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-text-muted italic">
                    Tên đăng nhập không thể thay đổi.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 hover:bg-gray-100 rounded text-sm font-bold text-text-main transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </ModalPanel>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}
