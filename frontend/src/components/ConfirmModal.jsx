import GlobalModal from "./GlobalModal";

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return (
    <GlobalModal open={open} onClose={onCancel}>
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="confirm-actions">
          <button className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </GlobalModal>
  );
}

export default ConfirmModal;