import React from "react";

function ThreadPanel({ close }) {

  return (

    <div className="thread-panel">

      <div className="thread-header">

        <h4>Thread</h4>

        <button onClick={close}>
          Close
        </button>

      </div>

      <p>Thread replies will appear here</p>

    </div>

  );
}

export default ThreadPanel;