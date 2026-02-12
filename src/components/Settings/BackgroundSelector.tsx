import React, { useState, useEffect, useContext } from 'react';
import { Modal, Tabs, Button, message, Spin } from 'antd';
import { uploadBackgroundImage, updateConversationBackground } from '../../api/background.api';
import { AuthContext } from '../../context/AuthContext';

interface BackgroundSelectorProps {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  currentBackground?: string;
  currentType?: string;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  open,
  onClose,
  conversationId,
  currentBackground,
  currentType,
}) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [selectedBackground, setSelectedBackground] = useState<string | undefined>(currentBackground);
  const [selectedType, setSelectedType] = useState<string>(currentType || 'default');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentBackground);

  const defaultGradients = [
    { name: 'Ocean Blue', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', type: 'gradient' },
    { name: 'Warm Flame', value: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', type: 'gradient' },
    { name: 'Night Fade', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', type: 'gradient' },
    { name: 'Spring Warmth', value: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', type: 'gradient' },
    { name: 'Juicy Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', type: 'gradient' },
    { name: 'Cool Blues', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', type: 'gradient' },
  ];

  const solidColors = [
    { name: 'Default', value: 'transparent', type: 'default' },
    { name: 'Trắng', value: '#ffffff', type: 'solid' },
    { name: 'Xám nhạt', value: '#f5f5f5', type: 'solid' },
    { name: 'Xám đậm', value: '#1f1f1f', type: 'solid' },
    { name: 'Đen', value: '#000000', type: 'solid' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      message.error('Chỉ hỗ trợ định dạng: JPG, PNG, WEBP, GIF');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadBackgroundImage(file);
      setPreviewUrl(url);
      setSelectedBackground(url);
      setSelectedType('custom');
      message.success('Tải lên thành công!');
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('Không thể tải lên hình ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    if (!user) return;

    try {
      await updateConversationBackground(conversationId, user.id, {
        backgroundUrl: selectedBackground,
        backgroundType: selectedType,
      });
      message.success('Đã cập nhật hình nền!');
      onClose();
    } catch (error) {
      console.error('Failed to update background:', error);
      message.error('Không thể cập nhật hình nền');
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    try {
      await updateConversationBackground(conversationId, user.id, {
        backgroundUrl: undefined,
        backgroundType: 'default',
      });
      setSelectedBackground(undefined);
      setSelectedType('default');
      setPreviewUrl(undefined);
      message.success('Đã xóa hình nền!');
      onClose();
    } catch (error) {
      console.error('Failed to remove background:', error);
      message.error('Không thể xóa hình nền');
    }
  };

  const tabItems = [
    {
      key: 'gradients',
      label: 'Gradient',
      children: (
        <div className="grid grid-cols-2 gap-3">
          {defaultGradients.map((gradient) => (
            <div
              key={gradient.name}
              onClick={() => {
                setSelectedBackground(gradient.value);
                setSelectedType(gradient.type);
                setPreviewUrl(gradient.value);
              }}
              className={`cursor-pointer rounded-lg overflow-hidden h-24 flex items-center justify-center transition-all ${
                selectedBackground === gradient.value ? 'ring-4 ring-primary scale-105' : 'hover:scale-102'
              }`}
              style={{ background: gradient.value }}
            >
              <span className="text-white font-semibold text-shadow">{gradient.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'solid',
      label: 'Màu đơn',
      children: (
        <div className="grid grid-cols-3 gap-3">
          {solidColors.map((color) => (
            <div
              key={color.name}
              onClick={() => {
                setSelectedBackground(color.value);
                setSelectedType(color.type);
                setPreviewUrl(color.value);
              }}
              className={`cursor-pointer rounded-lg h-20 flex items-center justify-center border-2 transition-all ${
                selectedBackground === color.value
                  ? 'ring-4 ring-primary scale-105'
                  : 'border-gray-300 hover:scale-102'
              }`}
              style={{ background: color.value }}
            >
              <span className={color.value === '#000000' || color.value === '#1f1f1f' ? 'text-white' : 'text-gray-800'}>
                {color.name}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'upload',
      label: 'Tải lên',
      children: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="background-upload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="background-upload" className="cursor-pointer">
              {uploading ? (
                <Spin />
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-gray-400 mb-2">cloud_upload</span>
                  <p className="text-gray-600">Nhấn để chọn hình ảnh</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF (tối đa 5MB)</p>
                </>
              )}
            </label>
          </div>

          {previewUrl && selectedType === 'custom' && (
            <div className="border rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Tùy chỉnh hình nền"
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="remove" danger onClick={handleRemove}>
          Xóa hình nền
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Áp dụng
        </Button>,
      ]}
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default BackgroundSelector;
