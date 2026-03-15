import React from "react";

function FileGallery({ close }) {

  return (

    <div className="file-gallery">

      <h3>Shared Files</h3>

      <button onClick={close}>
        Close
      </button>

    </div>

  );
}

export default FileGallery;