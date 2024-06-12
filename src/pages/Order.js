import React, { useState, useEffect, useRef } from "react";
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
} from "react-bootstrap";
import { BrowserRouter as Router, Link } from "react-router-dom";
import axios from "../utils/axios";
import Swal from "sweetalert2";
import { useHistory } from "react-router-dom";
import { removeUserSession } from "../utils/Common";
import moment from "moment";
import { useDownloadExcel } from "react-export-table-to-excel";

function Order() {
  const [data, setData] = useState([]);
  const history = useHistory();
  const [date, setDate] = useState();
  const [hotels, setHotels] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState();
  const [status1, setStatus1] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      console.error("Logout error:", error);
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Failed to logout. Please try again.",
      });
    }
  };

  const getMealsOrder = async (date) => {
    try {
      //setIsLoading(true);
      console.log("date:", date);
      const response = await axios.get(`api/meals/order/${date}`);
      console.log("Data fetch by API, res.data: ", response.data);
      setData(response.data.data);
      extractUniqueNames(response.data.data);
      const hasStatus1 = response.data.data.some(
        (item) => item.stts_order === 1
      );
      console.log("has status1 : ", hasStatus1);
      setStatus1(hasStatus1);
      setDataFetched(true);
    } catch (err) {
      console.log("error : ", err);
    } finally {
      //isLoading(false);
      console.log("DONE");
    }
  };

  const extractUniqueNames = (data) => {
    const uniqueHotels = [...new Set(data.map((item) => item.nm_hotel))];
    const uniqueDepartments = [
      ...new Set(data.map((item) => item.nm_department)),
    ];
    setHotels(uniqueHotels);
    setDepartments(uniqueDepartments);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    getMealsOrder(date);
    setFormSubmitted(true);
    setDateSubmitted(date);
  };

  // useEffect(() => {
  //   if (date) {
  //     getMealsOrder(date);
  //   }
  // }, [date]);

  const getDepartmentData = (hotelName, departmentName) => {
    return data.filter(
      (item) =>
        item.nm_hotel === hotelName && item.nm_department === departmentName
    );
  };

  const onConfirm = async () => {
    try {
      console.log("confirm date:", dateSubmitted);
      const response = await axios.post(`/api/confirm/order/`, {
        dateSubmitted,
      });
      console.log("Data fetch by API, res.data: ", response.data);
    } catch (err) {
      console.log("error : ", err);
    } finally {
      console.log("Confirm DONE");
    }
  };

  const tableRef = useRef(null);

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Meals Order - " + dateSubmitted,
    sheet: dateSubmitted,
  });

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-5">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Meals Order
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
            </Nav>
            <Nav className="ml-auto">
              <Nav.Link onClick={() => doLogout()}>Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "auto" }}
      >
        <Form className="d-flex flex-row" onSubmit={handleSearch}>
          <Form.Group className="mb-3 me-2">
            <Form.Label style={{ fontSize: "11px" }}>Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ fontSize: "11px" }}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="align-self-end mb-3 me-2"
            style={{ fontSize: "11px" }}
          >
            Search
          </Button>
        </Form>
      </Container>

      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "auto" }}
      >
        <Card
          className="text-justify"
          style={{ width: "100%", fontSize: "11px" }}
        >
          <Card.Body>
            <Card.Title>MEALS ORDER</Card.Title>
            <Card.Text>Set date to get Meals Order</Card.Text>
            {date && formSubmitted && dataFetched && dateSubmitted && (
              <Row className="align-items-center mb-3">
                <Col>
                  <Card.Text style={{ fontSize: "14px", fontWeight: "bold" }}>
                    Order for: {moment(dateSubmitted).format("dddd")},{" "}
                    {moment(dateSubmitted).format("LL")}
                  </Card.Text>
                </Col>
                {!status1 && (
                  <Col className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      type="submit"
                      style={{ fontSize: "11px" }}
                      onClick={onConfirm}
                    >
                      Confirm this Order
                    </Button>
                  </Col>
                )}
              </Row>
            )}
            <Table className="table-bordered" responsive="sm" ref={tableRef}>
              <thead>
                <tr>
                  <th rowSpan="2">Departments</th>
                  {hotels.map((hotel, index) => (
                    <th key={index} colSpan="3">
                      {hotel}
                    </th>
                  ))}
                  <th rowSpan="2">Total by Departments</th>
                </tr>
                <tr>
                  {hotels.map((hotel, index) => (
                    <React.Fragment key={index}>
                      <th key={`m-${index}`}>M</th>
                      <th key={`a-${index}`}>A</th>
                      <th key={`e-${index}`}>E</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => {
                  let deptTotal = { M: 0, A: 0, E: 0 };
                  return (
                    <tr key={index}>
                      <td>{dept}</td>
                      {hotels.map((hotel, hotelIndex) => {
                        const deptData = getDepartmentData(hotel, dept);
                        const mAmount =
                          deptData.length > 0 ? deptData[0].M_amount : 0;
                        const aAmount =
                          deptData.length > 0 ? deptData[0].A_amount : 0;
                        const eAmount =
                          deptData.length > 0 ? deptData[0].E_amount : 0;

                        deptTotal.M += mAmount;
                        deptTotal.A += aAmount;
                        deptTotal.E += eAmount;

                        return (
                          <React.Fragment key={hotelIndex}>
                            <td key={`m-${hotelIndex}-${index}`}>{mAmount}</td>
                            <td key={`a-${hotelIndex}-${index}`}>{aAmount}</td>
                            <td key={`e-${hotelIndex}-${index}`}>{eAmount}</td>
                          </React.Fragment>
                        );
                      })}
                      <td>{deptTotal.M + deptTotal.A + deptTotal.E}</td>
                    </tr>
                  );
                })}
                <tr>
                  <th>Total by Shift</th>
                  {hotels.map((hotel, hotelIndex) => {
                    const totals = {
                      M: 0,
                      A: 0,
                      E: 0,
                    };
                    departments.forEach((dept) => {
                      const deptData = getDepartmentData(hotel, dept);
                      if (deptData.length > 0) {
                        totals.M += deptData[0].M_amount;
                        totals.A += deptData[0].A_amount;
                        totals.E += deptData[0].E_amount;
                      }
                    });
                    return (
                      <React.Fragment key={hotelIndex}>
                        <th key={`total-m-${hotelIndex}`}>{totals.M}</th>
                        <th key={`total-a-${hotelIndex}`}>{totals.A}</th>
                        <th key={`total-e-${hotelIndex}`}>{totals.E}</th>
                      </React.Fragment>
                    );
                  })}
                  <th rowSpan="2">
                    {hotels.reduce((acc, hotel) => {
                      return (
                        acc +
                        departments.reduce((deptAcc, dept) => {
                          const deptData = getDepartmentData(hotel, dept);
                          if (deptData.length > 0) {
                            return (
                              deptAcc +
                              deptData[0].M_amount +
                              deptData[0].A_amount +
                              deptData[0].E_amount
                            );
                          }
                          return deptAcc;
                        }, 0)
                      );
                    }, 0)}
                  </th>
                </tr>
                <tr>
                  <th>Total by Hotel</th>
                  {hotels.map((hotel, hotelIndex) => {
                    let total = 0;
                    departments.forEach((dept) => {
                      const deptData = getDepartmentData(hotel, dept);
                      if (deptData.length > 0) {
                        total +=
                          deptData[0].M_amount +
                          deptData[0].A_amount +
                          deptData[0].E_amount;
                      }
                    });
                    return (
                      <th key={`total-hotel-${hotelIndex}`} colSpan="3">
                        {total}
                      </th>
                    );
                  })}
                </tr>
              </tbody>
            </Table>
            <Button
              variant="primary"
              type="submit"
              className="align-right me-2"
              style={{ fontSize: "11px" }}
              onClick={onDownload}
            >
              Download Excel
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Order;
