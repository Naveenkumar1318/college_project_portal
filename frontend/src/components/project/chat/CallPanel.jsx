import React from "react";

function CallPanel({ close }) {

  return (

    <div className="call-panel">

      <h3>Video Call</h3>

      <button onClick={close}>
        End Call
      </button>

    </div>

  );
}

export default CallPanel;