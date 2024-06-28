import React, { useState, useEffect } from "react";
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
  Image,
} from "react-bootstrap";
import logo from "../assets/logo.png";
import white from "../assets/White.jpg";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { removeUserSession } from "../utils/Common";
import Swal from "sweetalert2";

function Header() {
  const history = useHistory();

  const doLogout = async () => {
    try {
      const confirmed = await Swal.fire({
        title: "Logout",
        text: "Are you sure you want to logout?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, logout",
      });

      if (confirmed.isConfirmed) {
        removeUserSession();
        history.push("/");
      }
    } catch (error) {
      //console.error("Logout error:", error);
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Failed to logout. Please try again.",
      });
    }
  };
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        {/* <Navbar.Brand as={Link} to="/">
          Meals Order
        </Navbar.Brand> */}
        <Navbar.Brand as={Link} to="/">
          <img width={50} src={white} alt="Logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              Order List
            </Nav.Link>
            <Nav.Link as={Link} to="/recapitulation">
              Recapitulation
            </Nav.Link>
            <Nav.Link as={Link} to="/vendor">
              Vendor
            </Nav.Link>
          </Nav>
          <Nav className="ml-auto">
            <Nav.Link onClick={() => doLogout()}>Logout</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
