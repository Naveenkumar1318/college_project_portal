import { FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";

function OtpField({
  label,
  name,
  value,
  type,
  verified,
  onChange,
  onVerifyClick
}) {
  return (
    <div className="otp-field">
      <div className="otp-input-wrapper">
        <input
          name={name}
          type={type === "email" ? "email" : "text"}
          value={value || ""}
          onChange={onChange}
          placeholder={label}
        />

        {verified && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <FaCheckCircle className="verified-icon" />
          </motion.div>
        )}
      </div>

      {!verified && value && (
        <button
          className="btn-verify"
          onClick={onVerifyClick}
        >
          Verify
        </button>
      )}
    </div>
  );
}

export default OtpField;