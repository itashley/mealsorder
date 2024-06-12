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
} from "react-bootstrap";
import { BrowserRouter as Router, Link } from "react-router-dom";
import axios from "../utils/axios";
import Swal from "sweetalert2";
import { useHistory } from "react-router-dom";
import { removeUserSession } from "../utils/Common";
import moment from "moment";
import { useDownloadExcel } from "react-export-table-to-excel";

function Recap() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState([]);
  const history = useHistory();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [price, setPrice] = useState("");

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkRangeDate, setCheckRangeDate] = useState(false);

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

  const getListRec = async (startDate, endDate) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `api/recap/data/${startDate}/${endDate}`
      );
      console.log(response.data);
      setData(response.data.data);
      setRange(response.data.range);
      setDataFetched(true);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
      console.log("DONE");
    }
  };

  const handleSearch = (e) => {
    if (startDate > endDate) {
      // If start date is greater than end date
      setCheckRangeDate(true);
      console.log("check range date : ", checkRangeDate);
    } else {
      setCheckRangeDate(false);
      console.log("check range date : ", checkRangeDate);
    }
    e.preventDefault();
    getListRec(startDate, endDate);
    setFormSubmitted(true);
    console.log("formSubmitted : ", formSubmitted);
    setDataFetched(true);
  };

  const handlePriceChange = (e) => {
    const formattedPrice = e.target.value
      .replace(/\D/g, "")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPrice(formattedPrice);
  };

  // Helper function to get total amount for a specific hotel on a specific date
  const getTotalAmount = (hotel, date) => {
    const ordersOnDate = data.filter(
      (d) => d.nm_hotel === hotel && d.order_date === date
    );
    return ordersOnDate.reduce((total, order) => {
      return total + order.M_amount + order.A_amount + order.E_amount;
    }, 0);
  };

  // Helper function to get total amount for a specific hotel across all dates
  const getTotalAmountForHotel = (hotel) => {
    return range.reduce((total, date) => {
      const amount = getTotalAmount(hotel, date);
      return total + amount;
    }, 0);
  };

  // Helper function to get total amount for a specific date
  const getTotalAmountForDate = (date) => {
    return data.reduce((total, order) => {
      if (order.order_date === date) {
        return total + order.M_amount + order.A_amount + order.E_amount;
      }
      return total;
    }, 0);
  };

  // Render the table rows
  const renderTableData = () => {
    const hotelNames = [...new Set(data.map((item) => item.nm_hotel))]; // Get unique hotel names
    return hotelNames.map((hotel, index) => {
      const totalAmountForHotel = getTotalAmountForHotel(hotel);
      const totalPrice =
        totalAmountForHotel *
        parseFloat(price.replace(".", "").replace(",", "."));

      return (
        <tr key={index}>
          <td>{hotel}</td>
          {range.map((date, i) => (
            <td key={i}>{getTotalAmount(hotel, date)}</td>
          ))}
          <td>{totalAmountForHotel.toLocaleString()}</td>
          {price && <td>{totalPrice.toLocaleString()}</td>}
        </tr>
      );
    });
  };

  // Render the total row
  const renderTotalRow = () => {
    const totals = range.map((date) => {
      return data.reduce((total, hotel) => {
        const amount = getTotalAmount(hotel.nm_hotel, date);
        return total + amount;
      }, 0);
    });

    const totalsForDate = range.map((date) => getTotalAmountForDate(date));

    // Calculate total for all dates (sum of totalsForDate)
    const totalAll = totalsForDate.reduce((total, amount) => total + amount, 0);

    const priceTotalTotal =
      totalAll * parseFloat(price.replace(".", "").replace(",", "."));

    return (
      <tr>
        <th>TOTAL</th>
        {totalsForDate.map((total, index) => (
          <th key={index}>{total.toLocaleString()}</th>
        ))}
        <th>{totalAll.toLocaleString()}</th>
        {price && <th>{priceTotalTotal.toLocaleString()}</th>}
      </tr>
    );
  };

  useEffect(() => {
    getListRec(startDate, endDate); // Initially fetch data
    console.log(range);
  }, []);

  const tableRef = useRef(null);

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Recap Catering " + startDate + " - " + endDate + " Rp" + price,
    sheet: startDate + " - " + endDate,
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
            <Form.Label style={{ fontSize: "11px" }}>From</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ fontSize: "11px" }}
            />
          </Form.Group>

          <Form.Group className="mb-3 me-2">
            <Form.Label style={{ fontSize: "11px" }}>Until</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{ fontSize: "11px" }}
            />
          </Form.Group>

          <Form.Group className="mb-3 me-2">
            <Form.Label style={{ fontSize: "11px" }}>Price</Form.Label>
            <Form.Control
              type="text"
              value={price}
              onChange={handlePriceChange}
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
            <Card.Title>REKAPITULASI CATERING</Card.Title>
            <Card.Text>Set date range to get report</Card.Text>
            {price && <Card.Text>Entered Price : Rp{price}</Card.Text>}
            {!checkRangeDate ? (
              formSubmitted ? (
                dataFetched && !isLoading ? (
                  data.length > 0 ? (
                    <Table
                      className="table-bordered"
                      responsive="sm"
                      ref={tableRef}
                    >
                      <thead>
                        <tr>
                          <th>Nama Hotel</th>
                          {range.map((date, index) => (
                            <th key={index}>{moment(date).format("LL")}</th>
                          ))}
                          <th>TOTAL</th>
                          {price && <th>Total Price</th>}{" "}
                          {/* New column header */}
                        </tr>
                      </thead>
                      <tbody>
                        {renderTableData()}
                        {renderTotalRow()}
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
              )
            ) : (
              <p>Incorrect date range. Please check your dates.</p>
            )}
            {!isLoading && dataFetched && data.length > 0 && (
              <Button
                variant="primary"
                type="submit"
                className="align-right me-2"
                style={{ fontSize: "11px" }}
                onClick={onDownload}
              >
                Download Excel
              </Button>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Recap;
