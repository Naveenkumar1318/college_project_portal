import React from "react";

function PresenceIndicator({ status }) {

  const color = status === "online" ? "green" : "gray";

  return (

    <span
      style={{
        width:10,
        height:10,
        background:color,
        borderRadius:"50%",
        display:"inline-block",
        marginLeft:8
      }}
    />

  );
}

export default PresenceIndicator;