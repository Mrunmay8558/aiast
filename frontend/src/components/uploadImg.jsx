import React, { useState } from "react";
import axios from "axios";

const BaseURL = "http://localhost:8000/";

const UploadImg = ({ setFormData }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageUpload = async () => {
    if (selectedImage) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = async () => {
          const base64Image = reader.result;
          const response = await axios.post(BaseURL + "v1/fetch-image-data", {
            image_url: base64Image,
          });
          if (response.data) {
            setFormData(response.data);
          }
        };
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };
  const handleImageChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleImageUpload}>Upload Image</button>
    </div>
  );
};

export default UploadImg;
