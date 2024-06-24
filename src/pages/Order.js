import React, { useState, useRef } from "react";
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
import { removeUserSession } from "../utils/Common";
import moment from "moment";
//import { useDownloadExcel } from "react-export-table-to-excel";
import { utils, writeFileXLSX } from "xlsx";

function Order() {
  const [data, setData] = useState([]);
  const history = useHistory();
  const [date, setDate] = useState("");
  const [hotels, setHotels] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState();
  const [status1, setStatus1] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searching, setSearching] = useState(false);
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
      setSearching(true);
      setIsLoading(true);
      console.log("date:", date);
      const response = await axios.get(`api/meals/order/${date}`);
      console.log("Data fetch by API, res.data: ", response.data);
      setData(response.data.data);
      extractUniqueNames(response.data.data);
      const hasStatus0 = response.data.data.some(
        (item) => item.stts_order === 0
      );
      console.log("has status0 : ", hasStatus0);
      setStatus1(!hasStatus0);
      setDataFetched(true);
    } catch (err) {
      console.log("error : ", err);
    } finally {
      setIsLoading(false);
      setSearching(false);
      console.log("get meals order DONE");
    }
  };

  const extractUniqueNames = (data) => {
    // Get unique hotel names
    const uniqueHotels = [...new Set(data.map((item) => item.nm_hotel))];

    // Sort unique hotels by hotel_id
    uniqueHotels.sort((hotelA, hotelB) => {
      // Find the data objects for hotelA and hotelB
      const hotelAData = data.find((item) => item.nm_hotel === hotelA);
      const hotelBData = data.find((item) => item.nm_hotel === hotelB);

      // Compare hotel_id values
      return hotelAData.hotel_id - hotelBData.hotel_id;
    });

    // Get unique departments
    const uniqueDepartments = [
      ...new Set(data.map((item) => item.nm_department)),
    ];

    // Update state with sorted hotels and departments
    setHotels(uniqueHotels);
    console.log("hotels in extract: ", uniqueHotels);
    setDepartments(uniqueDepartments);
    console.log("departments in extract: ", departments);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    getMealsOrder(date);
    setFormSubmitted(true);
    setDateSubmitted(date);
    setDataFetched(true);
  };

  // useEffect(() => {
  //   // Calculate tomorrow's date
  //   const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
  //   setDate(tomorrow);
  //   getMealsOrder(tomorrow);
  //   //setFormSubmitted(true);
  //   setDateSubmitted(tomorrow);
  // }, []);

  const getDepartmentData = (hotelName, departmentName) => {
    return data.filter(
      (item) =>
        item.nm_hotel === hotelName && item.nm_department === departmentName
    );
  };

  const getToken = () => {
    // Retrieve token from localStorage
    const token = localStorage.getItem("token");

    // Return the token
    return token;
  };

  const onConfirm = async () => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("No authorization token found");
      }
      setConfirming(true);
      console.log("confirm date:", dateSubmitted);

      const response = await axios.post(`/public/api/confirm/order`, {
        date: dateSubmitted,
      });
      console.log("Data fetch by API, res.data: ", response.data);
      setStatus1(true);
      console.log("status1: ", status1);
      setConfirming(false);
    } catch (err) {
      console.log("Error:", err);
      console.log("Response:", err.response);
    } finally {
      console.log("Confirm DONE");
    }
  };

  const tableRef = useRef(null);

  // const { onDownload } = useDownloadExcel({
  //   currentTableRef: tableRef.current,
  //   filename: "Meals Order - " + dateSubmitted,
  //   sheet: dateSubmitted,
  // });

  const xport = React.useCallback(() => {
    /* Create worksheet from HTML DOM TABLE */
    console.log("Current table ref: ", tableRef.current);
    const wb = utils.table_to_book(tableRef.current);

    /* Export to file (start a download) */
    writeFileXLSX(
      wb,
      "Meals Order - " + moment(dateSubmitted).format("DD/MM/YYYY") + ".xlsx"
    );
  });

  // const handleDownload = () => {
  //   console.log("Current table ref: ", tableRef.current);
  //   onDownload();
  // };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
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
            {searching ? "Searching..." : "Search"}
          </Button>
        </Form>
      </Container>

      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "auto" }}
      >
        {dateSubmitted ? (
          <Card
            className="text-justify, mb-3"
            style={{ width: "auto", fontSize: "11px", minWidth: "600px" }}
          >
            <Card.Body>
              <Card.Title>MEALS ORDER</Card.Title>
              <Card.Text>Set date to get Meals Order</Card.Text>

              {!isLoading && dataFetched && (
                <Row className="align-items-center mb-3">
                  <Col>
                    <Card.Text style={{ fontSize: "14px", fontWeight: "bold" }}>
                      Order for: {moment(dateSubmitted).format("dddd")},{" "}
                      {moment(dateSubmitted).format("LL")}
                    </Card.Text>
                  </Col>
                  {data.length > 0 &&
                    (status1 ? (
                      <Col className="d-flex justify-content-end">
                        <Card.Text
                          style={{ fontSize: "12px", fontWeight: "600" }}
                        >
                          This Order has been confirmed.
                        </Card.Text>
                      </Col>
                    ) : (
                      <Col className="d-flex justify-content-end">
                        <Button
                          variant="primary"
                          type="submit"
                          style={{ fontSize: "11px" }}
                          onClick={onConfirm}
                        >
                          {confirming ? "Confirming..." : "Confirm this Order"}
                        </Button>
                      </Col>
                    ))}
                </Row>
              )}

              {formSubmitted ? (
                dataFetched && !isLoading ? (
                  data.length > 0 ? (
                    <Table
                      className="table-bordered"
                      responsive="sm"
                      ref={tableRef}
                    >
                      <thead>
                        <tr>
                          <th
                            rowSpan="2"
                            style={{
                              width: "120px",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            Departments
                          </th>
                          {hotels.map((hotel, index) => (
                            <th
                              key={index}
                              colSpan="3"
                              style={{ width: "130px", textAlign: "center" }}
                            >
                              {hotel}
                            </th>
                          ))}
                          <th
                            rowSpan="2"
                            style={{
                              width: "100px",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            Total by Department
                          </th>
                        </tr>
                        <tr>
                          {hotels.map((hotel, index) => (
                            <React.Fragment key={index}>
                              <th
                                key={`m-${index}`}
                                style={{ textAlign: "center" }}
                              >
                                M
                              </th>
                              <th
                                style={{ textAlign: "center" }}
                                key={`a-${index}`}
                              >
                                A
                              </th>
                              <th
                                style={{ textAlign: "center" }}
                                key={`e-${index}`}
                              >
                                E
                              </th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* this isLoading isn't affect much */}
                        {isLoading ? (
                          <tr>
                            <td
                              colSpan={hotels.length * 3 + 2}
                              style={{ textAlign: "center" }}
                            >
                              Loading...
                            </td>
                          </tr>
                        ) : (
                          <>
                            {departments.map((dept, index) => {
                              let deptTotal = { M: 0, A: 0, E: 0 };
                              return (
                                <tr key={index}>
                                  <td>{dept}</td>
                                  {hotels.map((hotel, hotelIndex) => {
                                    const deptData = getDepartmentData(
                                      hotel,
                                      dept
                                    );
                                    const mAmount =
                                      deptData.length > 0
                                        ? deptData[0].M_amount
                                        : 0;
                                    const aAmount =
                                      deptData.length > 0
                                        ? deptData[0].A_amount
                                        : 0;
                                    const eAmount =
                                      deptData.length > 0
                                        ? deptData[0].E_amount
                                        : 0;

                                    deptTotal.M += mAmount;
                                    deptTotal.A += aAmount;
                                    deptTotal.E += eAmount;

                                    return (
                                      <React.Fragment key={hotelIndex}>
                                        <td
                                          style={{ textAlign: "center" }}
                                          key={`m-${hotelIndex}-${index}`}
                                        >
                                          {mAmount}
                                        </td>
                                        <td
                                          style={{ textAlign: "center" }}
                                          key={`a-${hotelIndex}-${index}`}
                                        >
                                          {aAmount}
                                        </td>
                                        <td
                                          style={{ textAlign: "center" }}
                                          key={`e-${hotelIndex}-${index}`}
                                        >
                                          {eAmount}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                  <td style={{ textAlign: "center" }}>
                                    {deptTotal.M + deptTotal.A + deptTotal.E}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr>
                              <th>Total by Shift</th>
                              {hotels.map((hotel, hotelIndex) => {
                                const totals = { M: 0, A: 0, E: 0 };
                                departments.forEach((dept) => {
                                  const deptData = getDepartmentData(
                                    hotel,
                                    dept
                                  );
                                  if (deptData.length > 0) {
                                    totals.M += deptData[0].M_amount;
                                    totals.A += deptData[0].A_amount;
                                    totals.E += deptData[0].E_amount;
                                  }
                                });
                                return (
                                  <React.Fragment key={hotelIndex}>
                                    <th
                                      style={{ textAlign: "center" }}
                                      key={`total-m-${hotelIndex}`}
                                    >
                                      {totals.M}
                                    </th>
                                    <th
                                      style={{ textAlign: "center" }}
                                      key={`total-a-${hotelIndex}`}
                                    >
                                      {totals.A}
                                    </th>
                                    <th
                                      style={{ textAlign: "center" }}
                                      key={`total-e-${hotelIndex}`}
                                    >
                                      {totals.E}
                                    </th>
                                  </React.Fragment>
                                );
                              })}
                              <th
                                rowSpan="2"
                                style={{
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                  fontSize: "13px",
                                }}
                              >
                                {hotels.reduce((acc, hotel) => {
                                  return (
                                    acc +
                                    departments.reduce((deptAcc, dept) => {
                                      const deptData = getDepartmentData(
                                        hotel,
                                        dept
                                      );
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
                                  const deptData = getDepartmentData(
                                    hotel,
                                    dept
                                  );
                                  if (deptData.length > 0) {
                                    total +=
                                      deptData[0].M_amount +
                                      deptData[0].A_amount +
                                      deptData[0].E_amount;
                                  }
                                });
                                return (
                                  <th
                                    key={`total-hotel-${hotelIndex}`}
                                    colSpan="3"
                                    style={{ textAlign: "center" }}
                                  >
                                    {total}
                                  </th>
                                );
                              })}
                            </tr>
                          </>
                        )}
                      </tbody>
                    </Table>
                  ) : (
                    <p>No data available for the selected date.</p>
                  )
                ) : (
                  <p>Loading...</p>
                )
              ) : (
                <p></p>
              )}
              {!isLoading && dataFetched && data.length > 0 && (
                <Button
                  variant="primary"
                  type="submit"
                  className="align-right me-2"
                  style={{ fontSize: "11px" }}
                  onClick={xport}
                >
                  Download Excel
                </Button>
              )}
            </Card.Body>
          </Card>
        ) : (
          <Card
            className="text-justify"
            style={{
              width: "auto",
              fontSize: "11px",
              minWidth: "600px",
              border: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: "49px",
            }}
          >
            <Card.Body
              style={{
                paddingTop: "4px",
                display: "flex",
                justifyContent: "start",
                alignItems: "start",
                flexDirection: "column",
              }}
            >
              <Card.Title
                style={{
                  fontWeight: "700",
                }}
              >
                MEALS ORDER
              </Card.Title>
              <Card.Text>Set date to get Meals Order.</Card.Text>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
}

export default Order;
