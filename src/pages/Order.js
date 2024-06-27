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
//import { savePDF } from "@progress/kendo-react-pdf";

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
  const [exportPressed, setExportPressed] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);

  //let pdfExportComponent;

  const [editMode, setEditMode] = useState(false);

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
      const hasStatus0 = response.data.data.some(
        (item) => item.stts_order === 0
      );
      console.log("data from data : ", data);
      console.log("has status0 : ", hasStatus0);
      setStatus1(!hasStatus0);
      setDataFetched(true);
    } catch (err) {
      console.log("error : ", err);
      setIsTimeout(true);
    } finally {
      setIsLoading(false);
      setSearching(false);
      console.log("get meals order DONE");
    }
  };

  const extractUniqueNames = (data) => {
    // Get unique hotels with IDs
    const uniqueHotels = data.reduce((acc, item) => {
      if (!acc.find((hotel) => hotel.name === item.nm_hotel)) {
        acc.push({ id: item.hotel_id, name: item.nm_hotel });
      }
      return acc;
    }, []);

    // Sort unique hotels by hotel_id
    uniqueHotels.sort((hotelA, hotelB) => hotelA.id - hotelB.id);

    // Get unique departments with IDs
    const uniqueDepartments = data.reduce((acc, item) => {
      if (!acc.find((dept) => dept.name === item.nm_department)) {
        acc.push({ id: item.dept_id, name: item.nm_department });
      }
      return acc;
    }, []);

    // Update state with sorted hotels and departments
    setHotels(uniqueHotels);
    console.log("hotels in extract: ", uniqueHotels);
    setDepartments(uniqueDepartments);
    console.log("departments in extract: ", uniqueDepartments);
  };

  const toggleEditMode = () => {
    if (editMode) {
      getMealsOrder(dateSubmitted);
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      console.log("Data: ", data);
      console.log("Date: ", dateSubmitted);
      const res = await axios.post(`/public/api/edit/order`, {
        date: dateSubmitted,
        data: data,
      });
      console.log("Api is hit!");
      console.log("Data fetch by API, res.data: ", res.data);
      setData(res.data.data);
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
    console.log("newValue:", newValue);
    console.log("deptIndex:", deptIndex);
    console.log("hotelIndex:", hotelIndex);
    console.log("column:", column);

    const updatedData = [...data];
    console.log("Updated data 1st: ", updatedData);

    // Get the department and hotel IDs
    const deptId = departments[deptIndex].id;
    const hotelId = hotels[hotelIndex].id;
    console.log("deptId:", deptId);
    console.log("hotelId:", hotelId);

    // Find the item that matches the department and hotel IDs
    const itemIndex = updatedData.findIndex(
      (item) => item.dept_id === deptId && item.hotel_id === hotelId
    );
    console.log("itemIndex:", itemIndex);

    if (itemIndex !== -1) {
      // Update the value of the specified column
      updatedData[itemIndex][column] = parseInt(newValue, 10) || 0;

      // Update the state and recalculate totals
      console.log("updatedData 2nd:", updatedData);
      setData(updatedData);
      calculateTotalsByShift();
      calculateTotalsByHotel();
    } else {
      console.log("Item not found in the data.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    getMealsOrder(date);
    setFormSubmitted(true);
    setDateSubmitted(date);
    setEditMode(false);
  };

  const renderTableData = () => {
    return departments.map((dept, deptIndex) => {
      let deptTotal = { M: 0, A: 0, E: 0 };
      return (
        <tr key={dept.id}>
          <td>{dept.name}</td>
          {hotels.map((hotel, hotelIndex) => {
            const deptData = getDepartmentData(hotel.id, dept.id);
            const mAmount = deptData.length > 0 ? deptData[0].M_amount : 0;
            const aAmount = deptData.length > 0 ? deptData[0].A_amount : 0;
            const eAmount = deptData.length > 0 ? deptData[0].E_amount : 0;

            deptTotal.M += mAmount;
            deptTotal.A += aAmount;
            deptTotal.E += eAmount;

            return (
              <React.Fragment key={hotel.id}>
                <td
                  style={{
                    textAlign: "center",
                    padding: editMode ? "0px" : "8px",
                    width: "44px",
                    height: "28px",
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
                        //height: "31px",
                        height: "96%",
                        paddingTop: "0px",
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
                    height: "28px",
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
                        height: "96%",
                        paddingTop: "0px",
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
                    height: "28px",
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
                        height: "96%",
                        paddingTop: "0px",
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
      totalShiftData[hotel.id] = { M: 0, A: 0, E: 0 };
      totalShiftSumData[hotel.id] = 0;

      departments.forEach((dept) => {
        const deptData = getDepartmentData(hotel.id, dept.id);
        if (deptData.length > 0) {
          totalShiftData[hotel.id].M += deptData[0].M_amount;
          totalShiftData[hotel.id].A += deptData[0].A_amount;
          totalShiftData[hotel.id].E += deptData[0].E_amount;
        }
      });
    });

    setTotalShift(totalShiftData);
    console.log("Total Shift Data:", totalShiftData);

    Object.values(totalShiftData).forEach((hotelData) => {
      totalShiftSumData.M += hotelData.M;
      totalShiftSumData.A += hotelData.A;
      totalShiftSumData.E += hotelData.E;
    });

    setTotalShiftSum(totalShiftSumData);
    console.log("Total Shift Sum Data:", totalShiftSumData);
  };

  const calculateTotalsByHotel = () => {
    const totalHotelData = {};
    const totalHotelSum = {};

    hotels.forEach((hotel) => {
      totalHotelData[hotel.id] = { M: 0, A: 0, E: 0 };
      totalHotelSum[hotel.id] = 0;
    });

    hotels.forEach((hotel) => {
      departments.forEach((dept) => {
        const deptData = getDepartmentData(hotel.id, dept.id);
        if (deptData.length > 0) {
          totalHotelData[hotel.id].M += deptData[0].M_amount;
          totalHotelData[hotel.id].A += deptData[0].A_amount;
          totalHotelData[hotel.id].E += deptData[0].E_amount;
        }
      });

      totalHotelSum[hotel.id] =
        totalHotelData[hotel.id].M +
        totalHotelData[hotel.id].A +
        totalHotelData[hotel.id].E;
    });

    setTotalHotel(totalHotelData);
    setTotalHotelSum(totalHotelSum);
    setTotalAll(
      Object.values(totalHotelSum).reduce((acc, total) => acc + total, 0)
    );

    console.log("Total Hotel Data:", totalHotelData);
    console.log("Total Hotel Sum:", totalHotelSum);
    console.log(
      "Total All:",
      Object.values(totalHotelSum).reduce((acc, total) => acc + total, 0)
    );
  };

  useEffect(() => {
    if (hotels.length > 0 && departments.length > 0) {
      calculateTotalsByShift();
      calculateTotalsByHotel();
    }
  }, [hotels, departments]);

  const getDepartmentData = (hotelId, departmentId) => {
    return data.filter(
      (item) => item.hotel_id === hotelId && item.dept_id === departmentId
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
  const tableRef2 = useRef(null);

  const xport = React.useCallback((ref, index) => {
    /* Create worksheet from HTML DOM TABLE */
    console.log("Current table ref: ", ref.current);
    const wb = utils.table_to_book(ref.current);

    /* Export to file (start a download) */

    if (!editMode) {
      if (index == "1") {
        writeFileXLSX(
          wb,
          "Meals Order - " +
            moment(dateSubmitted).format("DD/MM/YYYY") +
            ".xlsx"
        );
      } else if (index == "2") {
        writeFileXLSX(
          wb,
          "PHI PO Meal - " +
            moment(dateSubmitted).format("DD/MM/YYYY") +
            ".xlsx"
        );
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Please save or cancel the changes first",
        //text: err.message,
      });
    }
  });

  const handleExport1 = () => {
    if (tableRef.current) {
      xport(tableRef, "1");
    }
  };

  const handleExport2 = () => {
    if (tableRef2.current) {
      xport(tableRef2, "2");
    }
  };

  const pdfContentRef = useRef(null); // Ref for the div containing content to export

  const sendPDFToVendor = async () => {
    try {
      console.log("button export is pressed!");
      setExportPressed(true);

      const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            transform: scale(1.4); /* Adjust the scale as needed */
                            transform-origin: top left;
                        }
                    </style>
                </head>
                <body>${pdfContentRef.current.innerHTML}</body>
            </html>
        `;

      const response = await axios.post(`/public/api/msg/vendor`, {
        html: htmlContent,
        text: `${moment(dateSubmitted).format("dddd")}-${dateSubmitted}`,
        //id_vendor: 1,
        //date: dateSubmitted,
      });

      if (response.status === 200) {
        console.log("api is fetched!");
        console.log("response: ", response.data.data);
        const url = response.data.data;
        Swal.fire({
          icon: "success",
          title: "Success",
          html: `PDF generated and sent to vendor successfully. <br/><a href="${url}" target="_blank">View PDF</a>`,
        });
        // window.open(url); // Opens PDF in a new tab
      }
      setExportPressed(false);
    } catch (error) {
      setExportPressed(false);
      console.error("Error exporting to PDF:", error);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Vendor Not Found",
          text: "Vendor not found or phone number is missing. Please fill out Vendor Information in 'Vendor' Tab",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to export PDF. Please try again later.",
        });
      }
    } finally {
      setExportPressed(false);
    }
  };

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
            Search
            {/* {searching ? "Searching..." : "Search"} */}
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
            <Card.Body
              className="d-flex flex-column"
              style={{ paddingTop: "11px" }}
            >
              {/* {!formSubmitted &&
                data.length == 0(<Card.Title>MEALS ORDER</Card.Title>)} */}
              {/* <Card.Text className="mb-2">
                Set date to get Meals Order
              </Card.Text> */}

              {!isLoading && data.length == 0 && (
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
                        <div
                          ref={pdfContentRef}
                          style={{
                            marginTop: "2px",
                          }}
                        >
                          <Card.Text
                            style={{
                              fontSize: "14px",
                              fontWeight: "bold",
                              marginBottom: "0px",
                            }}
                          >
                            PHI PO Meal for:{" "}
                            {moment(dateSubmitted).format("dddd")},{" "}
                            {moment(dateSubmitted).format("LL")}
                          </Card.Text>

                          <Table
                            responsive="sm"
                            style={{
                              border: "1px solid black",
                              borderCollapse: "collapse",
                              marginTop: "10px",
                            }}
                            ref={tableRef2}
                          >
                            <thead>
                              <tr>
                                <th
                                  rowSpan="2"
                                  style={{
                                    width: "200px",
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  Hotel Name
                                </th>
                                <th
                                  colSpan="3"
                                  style={{
                                    textAlign: "center",
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  Shift
                                </th>
                              </tr>
                              <tr>
                                <th
                                  style={{
                                    textAlign: "center",
                                    border: "1px solid black",
                                    width: "50px",
                                    padding: "8px",
                                  }}
                                >
                                  M
                                </th>
                                <th
                                  style={{
                                    textAlign: "center",
                                    border: "1px solid black",
                                    width: "50px",
                                    padding: "8px",
                                  }}
                                >
                                  A
                                </th>
                                <th
                                  style={{
                                    textAlign: "center",
                                    border: "1px solid black",
                                    width: "50px",
                                    padding: "8px",
                                  }}
                                >
                                  E
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {hotels.map((hotel, hotelIndex) => {
                                return (
                                  <React.Fragment key={hotelIndex}>
                                    <tr>
                                      <td
                                        style={{
                                          border: "1px solid black",
                                          padding: "8px",
                                        }}
                                      >
                                        {hotel.name}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: "center",
                                          border: "1px solid black",
                                          padding: "8px",
                                        }}
                                        key={`total-m-${hotelIndex}`}
                                      >
                                        {totalShift[hotel.id]?.M ?? 0}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: "center",
                                          border: "1px solid black",
                                          padding: "8px",
                                        }}
                                        key={`total-a-${hotelIndex}`}
                                      >
                                        {totalShift[hotel.id]?.A ?? 0}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: "center",
                                          border: "1px solid black",
                                          padding: "8px",
                                        }}
                                        key={`total-e-${hotelIndex}`}
                                      >
                                        {totalShift[hotel.id]?.E ?? 0}
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  TOTAL BY SHIFT
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  {totalShiftSum.M}
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  {totalShiftSum.A}
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    border: "1px solid black",
                                    padding: "8px",
                                  }}
                                >
                                  {totalShiftSum.E}
                                </th>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                        <Container className="p-0 m-0 d-flex flex-row justify-content-between">
                          {!isLoading && dataFetched && data.length > 0 && (
                            <Button
                              variant="primary"
                              type="submit"
                              className="mb-2 me-2"
                              style={{
                                fontSize: "11px",
                                //width: "110px",
                                // paddingRight: "12px",
                                // paddingLeft: "12px",
                                //paddingBottom: "7px",
                                //paddingTop: "7px",
                              }}
                              onClick={handleExport2}
                            >
                              Download Excel
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            type="submit"
                            className="mb-2"
                            style={{ fontSize: "11px" }}
                            onClick={sendPDFToVendor}
                          >
                            {exportPressed
                              ? "Sending"
                              : "Send as PDF to Vendor"}
                          </Button>
                        </Container>
                      </Card>

                      <Card
                        className="border-0 ms-5"
                        style={{ marginTop: "0px" }}
                      >
                        <Container className="d-flex flex-row justify-content-between p-0">
                          {editMode && (
                            <p
                              className="m-0"
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                width: "400px",
                                height: "auto",
                                paddingTop: "8px",
                              }}
                            >
                              Click on the cell to edit
                            </p>
                          )}
                          <Container className="d-flex flex-row justify-content-end p-0">
                            {editMode && (
                              <Button
                                variant="primary"
                                onClick={saveChanges}
                                className="align-self-end ps-4 pe-4"
                                style={{ fontSize: "11px" }}
                              >
                                Save
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              type="submit"
                              className="align-self-end ms-2 ps-3 pe-3"
                              onClick={toggleEditMode}
                              style={{ fontSize: "11px" }}
                            >
                              {editMode ? "Cancel" : "Edit"}
                            </Button>
                          </Container>
                        </Container>

                        <Table
                          className="table-bordered mt-2 mb-3"
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
                                  {hotel.name}
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
                                          {totalShift[hotel.id]?.M ?? 0}
                                        </th>
                                        <th
                                          style={{ textAlign: "center" }}
                                          key={`total-a-${hotelIndex}`}
                                        >
                                          {totalShift[hotel.id]?.A ?? 0}
                                        </th>
                                        <th
                                          style={{ textAlign: "center" }}
                                          key={`total-e-${hotelIndex}`}
                                        >
                                          {totalShift[hotel.id]?.E ?? 0}
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
                                      {totalHotelSum[hotel.id]}
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
                ) : isTimeout ? (
                  <p>Fetching Data Timeout. Please try again</p>
                ) : (
                  <p>Fetching Data...</p>
                )
              ) : (
                <p></p>
              )}
              <Container className="d-flex flex-row justify-content-end m-0 p-0">
                {!isLoading && dataFetched && data.length > 0 && (
                  <Button
                    variant="primary"
                    type="submit"
                    className="mb-2 me-2"
                    style={{
                      fontSize: "11px",
                      //width: "110px",
                      //paddingRight: "12px",
                      //paddingLeft: "12px",
                      //paddingBottom: "7px",
                      //paddingTop: "7px",
                    }}
                    onClick={handleExport1}
                  >
                    Download Excel
                  </Button>
                )}
              </Container>
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
