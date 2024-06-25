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
import { removeUserSession } from "../utils/Common";
import moment from "moment";
//import { useDownloadExcel } from "react-export-table-to-excel";
import { utils, writeFileXLSX } from "xlsx";
import "../styles/styles.css"; // Adjust the path if necessary

function Order() {
  const [data, setData] = useState([]);
  const history = useHistory();
  const [date, setDate] = useState("");
  const [hotels, setHotels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalShift, setTotalShift] = useState({});
  const [totalShiftSum, setTotalShiftSum] = useState({ M: 0, A: 0, E: 0 });
  const [totalHotel, setTotalHotel] = useState({});
  const [totalHotelSum, setTotalHotelSum] = useState([]);
  const [totalAll, setTotalAll] = useState(0);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState();
  const [status1, setStatus1] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [originalData, setOriginalData] = useState([]);

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
      //calculateTotalsByShift();
      setOriginalData(response.data.data);
      const hasStatus0 = response.data.data.some(
        (item) => item.stts_order === 0
      );
      console.log("data from data : ", data);
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
    console.log("departments in extract: ", uniqueDepartments);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      //await axios.post(`api/edit/order/${date}`, data);
      console.log("Api is hit!");
      Swal.fire({
        icon: "success",
        title: "Changes saved successfully!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error("Error saving changes:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to save changes!",
        text: err.message,
      });
    } finally {
      setIsLoading(false);
      setEditMode(false); // Turn off edit mode after saving
    }
  };

  const handleDataChange = (newValue, deptIndex, hotelIndex, column) => {
    const updatedData = [...data];
    const deptData = updatedData.find(
      (item) => item.nm_department === departments[deptIndex]
    );
    const hotelData = deptData[hotels[hotelIndex]];

    if (hotelData) {
      hotelData[column] = parseInt(newValue, 10) || 0;
      setData(updatedData);
      calculateTotalsByShift();
      calculateTotalsByHotel();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    getMealsOrder(date);

    setFormSubmitted(true);
    setDateSubmitted(date);
  };

  const renderTableData = () => {
    return departments.map((dept, deptIndex) => {
      let deptTotal = { M: 0, A: 0, E: 0 };
      return (
        <tr key={deptIndex}>
          <td>{dept}</td>
          {hotels.map((hotel, hotelIndex) => {
            const deptData = getDepartmentData(hotel, dept);
            const mAmount = deptData.length > 0 ? deptData[0].M_amount : 0;
            const aAmount = deptData.length > 0 ? deptData[0].A_amount : 0;
            const eAmount = deptData.length > 0 ? deptData[0].E_amount : 0;

            deptTotal.M += mAmount;
            deptTotal.A += aAmount;
            deptTotal.E += eAmount;

            return (
              <React.Fragment key={hotelIndex}>
                <td
                  style={{
                    textAlign: "center",
                    padding: editMode ? "0px" : "8px",
                    width: "44px",
                  }}
                >
                  {editMode ? (
                    <input
                      type="number"
                      defaultValue={mAmount}
                      onBlur={(e) =>
                        handleDataChange(
                          e.target.value,
                          deptIndex,
                          hotelIndex,
                          "M_amount"
                        )
                      }
                      style={{
                        width: "100%", // Make the input fill the entire <td>
                        height: "100%",
                        paddingTop: "8px",
                        paddingBottom: "0px",
                        textAlign: "center",
                        boxSizing: "border-box", // Ensure padding and border are included in width
                        paddingRight: "0px", // Remove internal padding
                        paddingLeft: "0px", // Remove internal padding
                        border: "none", // Remove border if not needed
                        backgroundColor: "transparent", // Optional: Set background color
                      }}
                    />
                  ) : (
                    mAmount
                  )}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: editMode ? "0px" : "8px",
                    width: "44px",
                  }}
                >
                  {editMode ? (
                    <input
                      type="number"
                      defaultValue={aAmount}
                      onBlur={(e) =>
                        handleDataChange(
                          e.target.value,
                          deptIndex,
                          hotelIndex,
                          "A_amount"
                        )
                      }
                      style={{
                        width: "100%", // Make the input fill the entire <td>
                        height: "100%",
                        paddingTop: "8px",
                        paddingBottom: "0px",
                        textAlign: "center",
                        boxSizing: "border-box", // Ensure padding and border are included in width
                        paddingRight: "0px", // Remove internal padding
                        paddingLeft: "0px", // Remove internal padding
                        border: "none", // Remove border if not needed
                        backgroundColor: "transparent", // Optional: Set background color
                      }}
                    />
                  ) : (
                    aAmount
                  )}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: editMode ? "0px" : "8px",
                    width: "44px",
                  }}
                >
                  {editMode ? (
                    <input
                      type="number"
                      defaultValue={eAmount}
                      onBlur={(e) =>
                        handleDataChange(
                          e.target.value,
                          deptIndex,
                          hotelIndex,
                          "E_amount"
                        )
                      }
                      style={{
                        width: "100%", // Make the input fill the entire <td>
                        height: "100%",
                        paddingTop: "8px",
                        paddingBottom: "0px",
                        textAlign: "center",
                        boxSizing: "border-box", // Ensure padding and border are included in width
                        paddingRight: "0px", // Remove internal padding
                        paddingLeft: "0px", // Remove internal padding
                        border: "none", // Remove border if not needed
                        backgroundColor: "transparent", // Optional: Set background color
                      }}
                    />
                  ) : (
                    eAmount
                  )}
                </td>
              </React.Fragment>
            );
          })}
          <td style={{ textAlign: "center" }}>
            {deptTotal.M + deptTotal.A + deptTotal.E}
          </td>
        </tr>
      );
    });
  };

  const calculateTotalsByShift = () => {
    const totalShiftData = {};
    const totalShiftSumData = { M: 0, A: 0, E: 0 };

    hotels.forEach((hotel) => {
      totalShiftData[hotel] = { M: 0, A: 0, E: 0 };
      totalShiftSumData[hotel] = 0;
      departments.forEach((dept) => {
        const deptData = getDepartmentData(hotel, dept);
        if (deptData.length > 0) {
          totalShiftData[hotel].M += deptData[0].M_amount;
          totalShiftData[hotel].A += deptData[0].A_amount;
          totalShiftData[hotel].E += deptData[0].E_amount;
        }
      });
    });

    setTotalShift(totalShiftData);

    Object.values(totalShiftData).forEach((hotelData) => {
      totalShiftSumData.M += hotelData.M;
      totalShiftSumData.A += hotelData.A;
      totalShiftSumData.E += hotelData.E;
    });

    setTotalShiftSum(totalShiftSumData);
  };

  const calculateTotalsByHotel = () => {
    const totalHotelData = {};
    const totalHotelSum = {};

    hotels.forEach((hotel) => {
      totalHotelData[hotel] = { M: 0, A: 0, E: 0 };
      totalHotelSum[hotel] = 0;
    });

    hotels.forEach((hotel) => {
      departments.forEach((dept) => {
        const deptData = getDepartmentData(hotel, dept);
        if (deptData.length > 0) {
          totalHotelData[hotel].M += deptData[0].M_amount;
          totalHotelData[hotel].A += deptData[0].A_amount;
          totalHotelData[hotel].E += deptData[0].E_amount;
        }
      });

      totalHotelSum[hotel] =
        totalHotelData[hotel].M +
        totalHotelData[hotel].A +
        totalHotelData[hotel].E;
    });

    setTotalHotel(totalHotelData);
    setTotalHotelSum(totalHotelSum);
    setTotalAll(
      Object.values(totalHotelSum).reduce((acc, total) => acc + total, 0)
    );
  };

  useEffect(() => {
    if (hotels.length > 0 && departments.length > 0) {
      calculateTotalsByShift();
      calculateTotalsByHotel();
    }
  }, [hotels, departments]);

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
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: "auto" }}
      >
        <Form className="d-flex flex-row" onSubmit={handleSearch}>
          <Form.Group className="mb-4 me-2">
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
            className="align-self-end mb-4 me-2"
            style={{ fontSize: "11px" }}
          >
            {searching ? "Searching..." : "Search"}
          </Button>
        </Form>
        {/* <Card.Text
          style={{
            fontSize: "13px",
            fontWeight: "500",
            //paddingRight: "5px",
            width: "190px",
            marginBottom: "8px",
          }}
        >
          Set date to get Meals Order
        </Card.Text> */}
      </Container>

      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "auto", width: "auto" }}
      >
        {dateSubmitted ? (
          <Card
            className="text-justify, mb-3"
            style={{ width: "auto", fontSize: "11px", minWidth: "600px" }}
          >
            <Card.Body style={{ paddingTop: "11px" }}>
              {/* {!formSubmitted &&
                data.length == 0(<Card.Title>MEALS ORDER</Card.Title>)} */}
              {/* <Card.Text className="mb-2">
                Set date to get Meals Order
              </Card.Text> */}

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
                          {/* This Order has been confirmed. */}
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
                    <Container className="d-flex flex-row justify-content-between ms-0 ps-0 me-0 pe-0">
                      <Card className="border-0">
                        <Button
                          variant="primary"
                          type="submit"
                          className="align-self-end"
                          style={{ fontSize: "11px" }}
                        >
                          Order to Vendor
                        </Button>
                        <Table className="table-bordered mt-2" responsive="sm">
                          <thead>
                            <tr>
                              <th
                                rowSpan="2"
                                style={{
                                  width: "200px",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                Hotel Name
                              </th>
                              <th
                                colSpan="3"
                                style={{
                                  textAlign: "center",
                                }}
                              >
                                Shift
                              </th>
                            </tr>
                            <tr>
                              <th style={{ textAlign: "center" }}>M</th>
                              <th style={{ textAlign: "center" }}>A</th>
                              <th style={{ textAlign: "center" }}>E</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hotels.map((hotel, hotelIndex) => {
                              return (
                                <React.Fragment key={hotelIndex}>
                                  <tr>
                                    <td>{hotel}</td>
                                    <td
                                      style={{ textAlign: "center" }}
                                      key={`total-m-${hotelIndex}`}
                                    >
                                      {totalShift[hotel]?.M ?? 0}
                                    </td>
                                    <td
                                      style={{ textAlign: "center" }}
                                      key={`total-a-${hotelIndex}`}
                                    >
                                      {totalShift[hotel]?.A ?? 0}
                                    </td>
                                    <td
                                      style={{ textAlign: "center" }}
                                      key={`total-e-${hotelIndex}`}
                                    >
                                      {totalShift[hotel]?.E ?? 0}
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                            <tr>
                              <th className="text-center">TOTAL BY SHIFT</th>
                              <th>{totalShiftSum.M}</th>
                              <th>{totalShiftSum.A}</th>
                              <th>{totalShiftSum.E}</th>
                            </tr>
                          </tbody>
                        </Table>
                      </Card>
                      <Card className="border-0 ms-5">
                        <Container className="d-flex flex-row justify-content-between p-0">
                          {editMode && (
                            <p
                              className="m-0"
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                width: "200px",
                                height: "auto",
                                paddingTop: "8px",
                              }}
                            >
                              Click cell to edit
                            </p>
                          )}
                          <Container className="d-flex flex-row justify-content-end p-0">
                            {editMode && (
                              <Button
                                variant="primary"
                                onClick={saveChanges}
                                className="align-self-end "
                                style={{ fontSize: "11px" }}
                              >
                                Save
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              type="submit"
                              className="align-self-end ms-2 "
                              onClick={toggleEditMode}
                              style={{ fontSize: "11px" }}
                            >
                              {editMode ? "Cancel" : "Edit"}
                            </Button>
                          </Container>
                        </Container>

                        <Table
                          className="table-bordered mt-2"
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
                                  style={{
                                    minWidth: "120px",
                                    maxWidth: "200px",
                                    textAlign: "center",
                                  }}
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
                                    style={{
                                      textAlign: "center",
                                    }}
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
                                {renderTableData()}
                                <tr>
                                  <th>Total by Shift</th>
                                  {hotels.map((hotel, hotelIndex) => {
                                    return (
                                      <React.Fragment key={hotelIndex}>
                                        <th
                                          style={{ textAlign: "center" }}
                                          key={`total-m-${hotelIndex}`}
                                        >
                                          {totalShift[hotel]?.M ?? 0}
                                        </th>
                                        <th
                                          style={{ textAlign: "center" }}
                                          key={`total-a-${hotelIndex}`}
                                        >
                                          {totalShift[hotel]?.A ?? 0}
                                        </th>
                                        <th
                                          style={{ textAlign: "center" }}
                                          key={`total-e-${hotelIndex}`}
                                        >
                                          {totalShift[hotel]?.E ?? 0}
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
                                    {totalAll}
                                  </th>
                                </tr>
                                <tr>
                                  <th>Total by Hotel</th>
                                  {hotels.map((hotel, index) => (
                                    <th
                                      key={`total-hotel-${index}`}
                                      colSpan="3"
                                      style={{ textAlign: "center" }}
                                    >
                                      {totalHotelSum[hotel]}
                                    </th>
                                  ))}
                                </tr>
                              </>
                            )}
                          </tbody>
                        </Table>
                      </Card>
                    </Container>
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
