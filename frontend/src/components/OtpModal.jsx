import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import GlobalModal from "./GlobalModal";

function OtpModal({
  open,
  onClose,
  type = "",
  label = "",
  onSuccess
}) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputsRef = useRef([]);

  /* ================= SEND OTP ================= */

  const sendOtp = async () => {
    try {
      await API.post("/profile/send-otp", { type });
      toast.success("OTP sent successfully");
      setTimer(60);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Failed to send OTP"
      );
    }
  };

  /* ================= COUNTDOWN + RESET ================= */

  useEffect(() => {
    if (!open) return;

    setOtp(Array(6).fill(""));
    setSuccess(false);
    setTimer(30);

    sendOtp();

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  /* ================= INPUT HANDLING ================= */

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasteData) return;

    const newOtp = pasteData.split("");
    setOtp([
      ...newOtp,
      ...Array(6 - newOtp.length).fill("")
    ]);
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      toast.error("Enter complete OTP");
      return;
    }

    try {
      setLoading(true);

      await API.post("/profile/verify-otp", {
        type,
        otp: finalOtp
      });

      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalModal open={open} onClose={onClose}>
      <div className="otp-enterprise">
        <h3>Verify {label}</h3>

        <p className="otp-subtitle">
          Enter the 6-digit code sent to your{" "}
          {label.toLowerCase()}
        </p>

        {success ? (
          /* ================= SUCCESS ================= */
          <div className="success-checkmark">
            <div className="check-icon"></div>
          </div>
        ) : (
          <>
            {/* ================= OTP BOXES ================= */}
            <div
              className="otp-box-container"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) =>
                    (inputsRef.current[index] = el)
                  }
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) =>
                    handleChange(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  className="otp-box"
                />
              ))}
            </div>

            {/* ================= TIMER ================= */}
            <div className="otp-timer">
              {timer > 0 ? (
                <span>Resend in {timer}s</span>
              ) : (
                <button onClick={sendOtp}>
                  Resend OTP
                </button>
              )}
            </div>

            {/* ================= VERIFY BUTTON ================= */}
            <button
              className="otp-verify-enterprise"
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? (
                <div className="shimmer-btn"></div>
              ) : (
                "Verify"
              )}
            </button>
          </>
        )}
      </div>
    </GlobalModal>
  );
}

export default OtpModal;