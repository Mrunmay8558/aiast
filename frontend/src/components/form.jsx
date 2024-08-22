import React, { useState } from "react";

const formStyling = {
  display: "flex",
  flexDirection: "column",
  width: "50%",
  margin: "50px auto",
};

const formHeadingStyle = {
  fontSize: "20px",
  fontWeight: "bold",
};

const Form = ({ formData, setFormData, setSubmit }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmit(true);
    console.log("form Data", formData);
  };

  return (
    <>
      <form style={formStyling} onSubmit={handleSubmit}>
        <div style={formHeadingStyle}>Personal Details</div>
        <br />
        <label>
          First Name:
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Last Name:
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
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
          Gender:
          <input
            type="text"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          PAN:
          <input
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Contact Number:
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Email:
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          End Use:
          <input
            type="text"
            name="endUse"
            value={formData.endUse}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Address Line 1:
          <input
            type="text"
            name="addressL1"
            value={formData.addressL1}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Address Line 2:
          <input
            type="text"
            name="addressL2"
            value={formData.addressL2}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          City:
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          State:
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
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
        <br />
        <div style={formHeadingStyle}>Proffessional Details</div>
        <br />
        <label>
          Company Name:
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Official Email:
          <input
            type="text"
            name="officialEmail"
            value={formData.officialEmail}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Employment Type:
          <input
            type="text"
            name="employmentType"
            value={formData.employmentType}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Income:
          <input
            type="text"
            name="income"
            value={formData.income}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Udyam Number:
          <input
            type="text"
            name="udyamNumber"
            value={formData.udyamNumber}
            onChange={handleChange}
          />
        </label>
        <br />
        <br />
        <div style={formHeadingStyle}>Other Details</div>
        <br />
        <label>
          AA ID:
          <input
            type="text"
            name="aa_id"
            disabled
            value={formData.aa_id}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Bureau Consent:
          <input
            type="text"
            name="bureauConsent"
            value={formData.bureauConsent}
            onChange={handleChange}
          />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

export default Form;
