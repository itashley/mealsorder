import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./footer.css";

function Footer() {
  return (
    <footer
      style={{ fontSize: "12px" }}
      className="fixed-bottom bg-dark text-light py-3"
    >
      <Container>
        {/* <Row>
          <Col className="marquee">
            <span>
              This is the running text that moves from right to left across the
              screen. You can put any text you like here.
            </span>
          </Col>
        </Row> */}
        <Row>
          <Col className="text-center">
            <p className="mb-0">
              &copy; 2024 Ashley Hotel Group. All Rights Reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
