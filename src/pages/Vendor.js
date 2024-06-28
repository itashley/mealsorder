import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  Navbar,
  Nav,
  Card,
  Form,
  Button,
  Table,
  Row,
  Col,
  CardBody,
} from "react-bootstrap";
import { BrowserRouter as Router, Link } from "react-router-dom";
import axios from "../utils/axios";
import Swal from "sweetalert2";
import { useHistory } from "react-router-dom";
//import { removeUserSession } from "../utils/Common";
import Header from "../components/Header";
import Footer from "../components/Footer";
import moment from "moment";
//import { useDownloadExcel } from "react-export-table-to-excel";
import { utils, writeFileXLSX } from "xlsx";
import "../styles/styles.css"; // Adjust the path if necessary

function Vendor() {
  //const history = useHistory();

  const [vendor, setVendor] = useState({
    id_vendor: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVendorInformation();
  }, []);

  const getToken = () => {
    // Retrieve token from localStorage
    const token = localStorage.getItem("token");

    // Return the token
    return token;
  };

  const fetchVendorInformation = async () => {
    try {
      setIsLoading(true);
      //console.log("fetching api...");
      const response = await axios.get(`/api/vendor`); // Replace with your API endpoint
      //console.log("api fetched");
      //console.log("response: ", response.data.data);
      const { id_vendor, name, phone, email, address } = response.data.data;
      setVendor({ id_vendor, name, phone, email, address });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      // console.error("Error fetching vendor information:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendor information. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      //console.log("get vendor info DONE");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVendor({ ...vendor, [name]: value });
  };

  const handleEdit = () => {
    const token = getToken();
    if (!token) {
      throw new Error("No authorization token found");
    }
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      //console.log("saving...");
      const response = await axios.post("/api/edit/vendor", vendor); // Replace with your API endpoint
      //console.log("edit response:", response);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Vendor information updated successfully.",
      });
      setEditMode(false);
      setIsSaving(false);
    } catch (error) {
      setIsSaving(false);
      //console.error("Error updating vendor information:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update vendor information. Please try again later.",
      });
    } finally {
      setIsSaving(false);
      //console.log("saving vendor info DONE");
    }
  };

  const handleCancel = () => {
    fetchVendorInformation();
    setEditMode(false);
  };

  return (
    <div>
      <Header />

      <Container style={{ width: "600px", paddingTop: 20 }}>
        <h4 style={{ marginBottom: "30px", fontWeight: "700" }}>
          Meals Vendor Information
        </h4>

        <Form>
          <Form.Group as={Row} className="mb-3" controlId="formVendorName">
            <Form.Label column sm="2" style={{ fontSize: "14px" }}>
              Name
            </Form.Label>
            <Col sm="10">
              <Form.Control
                style={{ fontSize: "14px" }}
                type="text"
                placeholder="Enter vendor name"
                name="name"
                value={isLoading ? "Loading..." : vendor.name}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formVendorPhone">
            <Form.Label column sm="2" style={{ fontSize: "14px" }}>
              Phone
            </Form.Label>
            <Col sm="10">
              <Form.Control
                style={{ fontSize: "14px" }}
                type="text"
                placeholder="Enter vendor phone"
                name="phone"
                value={isLoading ? "Loading..." : vendor.phone}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formVendorEmail">
            <Form.Label column sm="2" style={{ fontSize: "14px" }}>
              Email
            </Form.Label>
            <Col sm="10">
              <Form.Control
                style={{ fontSize: "14px" }}
                type="email"
                placeholder="Enter vendor email"
                name="email"
                value={isLoading ? "Loading..." : vendor.email}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formVendorAddress">
            <Form.Label column sm="2" style={{ fontSize: "14px" }}>
              Address
            </Form.Label>
            <Col sm="10">
              <Form.Control
                style={{ fontSize: "14px" }}
                as="textarea"
                rows={3}
                placeholder="Enter vendor address"
                name="address"
                value={isLoading ? "Loading..." : vendor.address}
                onChange={handleInputChange}
                disabled={!editMode}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }}>
              {editMode ? (
                <>
                  <Button
                    style={{ width: "70px", fontSize: "14px" }}
                    variant="primary"
                    onClick={handleSave}
                  >
                    {isSaving ? "Saving.." : "Save"}
                  </Button>
                  <Button
                    style={{ width: "70px", fontSize: "14px" }}
                    variant="secondary"
                    className="ms-2"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  style={{ width: "70px", fontSize: "14px" }}
                  variant="primary"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}
            </Col>
          </Form.Group>
        </Form>
      </Container>

      <Footer />
    </div>
  );
}

export default Vendor;
