import React, { useState } from "react";
import { Modal, Input, message, ConfigProvider, theme } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { authApi } from "../../api/auth.api";
import { useTranslation } from "react-i18next";

const SecuritySettings: React.FC = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [sharedKey, setSharedKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // TODO: Fetch initial state from user profile

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await authApi.enableTwoFactor();
      setQrCodeUrl(response.authenticatorUri);
      setSharedKey(response.sharedKey);
      setIsModalVisible(true);
    } catch (error) {
      message.error(t("settings.security.two_factor.error_generate"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode) {
      message.error(t("settings.security.two_factor.invalid_code"));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyTwoFactorSetup({
        code: verificationCode,
      });
      if (response.success) {
        message.success(t("settings.security.two_factor.success_enable"));
        setIs2FAEnabled(true);
        setIsModalVisible(false);
        setVerificationCode("");
      } else {
        message.error(
          response.message || t("settings.security.two_factor.error_verify"),
        );
      }
    } catch (error) {
      message.error(t("settings.security.two_factor.error_verify"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      await authApi.disableTwoFactor();
      setIs2FAEnabled(false);
      message.success(t("settings.security.two_factor.success_disable"));
    } catch (error) {
      message.error(t("settings.security.two_factor.error_disable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">
          {t("settings.security.title")}
        </h2>
        <p className="text-slate-400 text-xs">
          {t("settings.security.subtitle")}
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-white mb-0.5">
              {t("settings.security.two_factor.title")}
            </h3>
            <p className="text-slate-400 text-xs">
              {t("settings.security.two_factor.description")}
            </p>
          </div>
          <div>
            {!is2FAEnabled ? (
              <button
                onClick={handleEnable2FA}
                disabled={loading}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-xs"
              >
                {loading && <span className="animate-spin text-sm">Wait</span>}
                {t("settings.security.two_factor.enable")}
              </button>
            ) : (
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
              >
                {t("settings.security.two_factor.disable")}
              </button>
            )}
          </div>
        </div>

        {is2FAEnabled && (
          <div className="mt-4 flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="material-symbols-outlined text-emerald-500 text-lg">
              check_circle
            </span>
            <div>
              <h4 className="text-emerald-500 font-medium text-sm">
                {t("settings.security.two_factor.enabled_alert")}
              </h4>
              <p className="text-emerald-500/80 text-xs mt-0.5">
                {t("settings.security.two_factor.enabled_desc")}
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorBgElevated: "#1e1e1e",
          },
        }}
      >
        <Modal
          title={
            <span className="text-white text-base">
              {t("settings.security.two_factor.modal_title")}
            </span>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={360}
          closeIcon={
            <span className="text-slate-400 hover:text-white transition-colors text-sm">
              ✕
            </span>
          }
        >
          <div className="flex flex-col items-center gap-5 pt-4">
            <div className="text-slate-200 text-center text-xs">
              {t("settings.security.two_factor.step_1")}
            </div>

            <div className="p-3 bg-white rounded-lg">
              <QRCodeSVG value={qrCodeUrl} size={150} />
            </div>

            <div className="text-center w-full">
              <p className="text-xs text-slate-400 mb-1.5">
                {t("settings.security.two_factor.manual_entry")}
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 font-mono text-center select-all text-emerald-400 font-bold tracking-wider break-all text-xs">
                {sharedKey}
              </div>
            </div>

            <div className="w-full pt-4 border-t border-white/10">
              <p className="text-slate-200 text-xs mb-2 text-center">
                {t("settings.security.two_factor.step_2")}
              </p>
              <div className="relative group mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-lg">
                    lock
                  </span>
                </div>
                <Input
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setVerificationCode(val);
                  }}
                  placeholder={t(
                    "settings.security.two_factor.placeholder_code",
                  )}
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg h-9 pl-9 pr-3 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-medium text-center tracking-[0.5em] text-base"
                  variant="borderless"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg font-medium transition-colors text-xs"
                >
                  {t("settings.security.two_factor.cancel")}
                </button>
                <button
                  onClick={handleVerifyAndEnable}
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-xs"
                >
                  {loading
                    ? "..."
                    : t("settings.security.two_factor.verify_btn")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default SecuritySettings;
