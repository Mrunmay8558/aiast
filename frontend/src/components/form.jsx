import React, { useState } from "react";

const formStyling = {
  display: "flex",
  flexDirection: "column",
  width: "50%",
  margin: "50px auto",
};

const Form = ({ formData, setFormData, setSubmit }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      address: {
        ...prevFormData.address,
        [name]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmit(true);
  };

  return (
    <form style={formStyling} onSubmit={handleSubmit}>
      <label>
        Name:
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Age:
        <input
          type="text"
          name="age"
          value={formData.age}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Date of Birth:
        <input
          type="text"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Aadhaar Number:
        <input
          type="text"
          name="aadhaar_number"
          value={formData.aadhaar_number}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Street:
        <input
          type="text"
          name="street"
          value={formData.address.street}
          onChange={handleAddressChange}
        />
      </label>
      <br />
      <label>
        Locality:
        <input
          type="text"
          name="locality"
          value={formData.address.locality}
          onChange={handleAddressChange}
        />
      </label>
      <br />
      <label>
        City:
        <input
          type="text"
          name="city"
          value={formData.address.city}
          onChange={handleAddressChange}
        />
      </label>
      <br />
      <label>
        State:
        <input
          type="text"
          name="state"
          value={formData.address.state}
          onChange={handleAddressChange}
        />
      </label>
      <br />
      <label>
        Country:
        <input
          type="text"
          name="country"
          value={formData.address.country}
          onChange={handleAddressChange}
        />
      </label>
      <br />
      <label>
        Pincode:
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
        />
      </label>
      <br />
      <label>
        Mobile Number:
        <input
          type="text"
          name="mobile_number"
          value={formData.mobile_number}
          onChange={handleChange}
        />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
