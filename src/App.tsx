import React, { useState, useRef, useEffect } from "react";

function App() {
  const [sides, setSides] = useState({ a: "", b: "", c: "" });
  const [message, setMessage] = useState("");
  const [triangleData, setTriangleData] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [angleTools, setAngleTools] = useState([
    { id: 1, x: 50, y: 50, isDragging: false, attachedVertex: null },
    { id: 2, x: 100, y: 50, isDragging: false, attachedVertex: null },
    { id: 3, x: 150, y: 50, isDragging: false, attachedVertex: null },
  ]);
  const svgRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSides({ ...sides, [name]: value });
  };

  const isValidTriangle = (a, b, c) => a + b > c && a + c > b && b + c > a;
  const isDegenerate = (a, b, c) => a + b === c || a + c === b || b + c === a;
  // Calculate triangle area using Heron's formula
  const calculateArea = (a, b, c) => {
    const s = (a + b + c) / 2; // semi-perimeter
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  };

  // Calculate perimeter
  const calculatePerimeter = (a, b, c) => a + b + c;

  // Classify triangle by angles
  const classifyByAngles = (a, b, c) => {
    const sides = [a, b, c].sort((x, y) => y - x); // Sort in descending order
    const [largest, middle, smallest] = sides;

    const largestSquared = largest * largest;
    const sumOfOtherSquares = middle * middle + smallest * smallest;

    if (Math.abs(largestSquared - sumOfOtherSquares) < 1e-10) {
      return "Right";
    } else if (largestSquared > sumOfOtherSquares) {
      return "Obtuse";
    } else {
      return "Acute";
    }
  };

  const calculateTrianglePoints = (a, b, c) => {
    const baseScale = 180 / Math.max(a, b, c);
    const scale = baseScale * zoom;
    const centerX = 350;
    const centerY = 175;

    // Check if it's a right triangle
    const sides = [a, b, c];
    const sortedSides = [...sides].sort((x, y) => x - y);
    const [s1, s2, s3] = sortedSides; // s1=smallest, s2=middle, s3=largest
    const isRightAngled = Math.abs(s1 * s1 + s2 * s2 - s3 * s3) < 1e-5;

    // Standard triangle construction where:
    // - Side 'c' is the base (between A and B)
    // - Side 'a' is opposite vertex A (between B and C)
    // - Side 'b' is opposite vertex B (between A and C)

    // Place A and B to form base side 'c'
    const A = { x: centerX - (c * scale) / 2, y: centerY + 50 };
    const B = { x: centerX + (c * scale) / 2, y: centerY + 50 };

    // Calculate angle at A using law of cosines
    const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c));

    // Place C using the angle and side length b
    const C = {
      x: A.x + b * scale * Math.cos(angleA),
      y: A.y - b * scale * Math.sin(angleA),
    };

    // Calculate all angles using law of cosines
    const angleAtA =
      Math.acos((b * b + c * c - a * a) / (2 * b * c)) * (180 / Math.PI);
    const angleAtB =
      Math.acos((a * a + c * c - b * b) / (2 * a * c)) * (180 / Math.PI);
    const angleAtC =
      Math.acos((a * a + b * b - c * c) / (2 * a * b)) * (180 / Math.PI);
    // Calculate area and perimeter
    const area = calculateArea(a, b, c);
    const perimeter = calculatePerimeter(a, b, c);
    const angleType = classifyByAngles(a, b, c);

    return {
      vertices: { A, B, C },
      angles: { A: angleAtA, B: angleAtB, C: angleAtC },
      sides: { a, b, c },
      area,
      perimeter,
      angleType,
      isRightAngled,
      // isRightAngled,
      hypotenuse: isRightAngled ? Math.max(a, b, c) : null,
      rightAngleVertex: isRightAngled
        ? Math.abs(angleAtA - 90) < 1e10
          ? "A"
          : Math.abs(angleAtB - 90) < 1e10
          ? "B"
          : "C"
        : null,
    };
  };
  // Handle zoom changes
  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);

    // Recalculate triangle with new zoom if triangle exists
    if (triangleData) {
      const a = parseFloat(sides.a);
      const b = parseFloat(sides.b);
      const c = parseFloat(sides.c);
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        const data = calculateTrianglePoints(a, b, c);
        setTriangleData(data);
      }
    }
  };

  const handleSubmit = () => {
    const a = parseFloat(sides.a);
    const b = parseFloat(sides.b);
    const c = parseFloat(sides.c);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a <= 0 || b <= 0 || c <= 0) {
      setMessage("Please enter valid positive numbers for all sides.");
      setTriangleData(null);
      return;
    }

    if (isValidTriangle(a, b, c)) {
      const data = calculateTrianglePoints(a, b, c);
      setTriangleData(data);

      // Determine triangle type
      let sideType = "";
      if (a === b && b === c) {
        sideType = "Equilateral";
      } else if (a === b || b === c || a === c) {
        sideType = "Isosceles";
      } else {
        sideType = "Scalene";
      }

      // Combine angle and side classifications
      const fullType = `${data.angleType} ,${sideType} Triangle`;
      setMessage(`Triangle Type: ${fullType}`);

      //setMessage(`Triangle Type: ${triangleType}`);
    } else if (isDegenerate(a, b, c)) {
      setMessage(
        "The triangle created by these sides will have an area of 0 sq. units."
      );
      setTriangleData(null);
    } else {
      setMessage("No triangle can be formed using these side lengths.");
      setTriangleData(null);
    }
  };

  const handleMouseDown = (e, isRotation = false) => {
    if (isRotation) {
      setIsDragging(true);
      const rect = svgRef.current.getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && triangleData) {
      const rect = svgRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const centerX = 350;
      const centerY = 175;

      const angle =
        Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
      setRotation(angle);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAngleToolMouseDown = (e, toolId) => {
    e.stopPropagation();
    setAngleTools((tools) =>
      tools.map((tool) =>
        tool.id === toolId ? { ...tool, isDragging: true } : tool
      )
    );
  };

  const handleAngleToolMouseMove = (e, toolId) => {
    const tool = angleTools.find((t) => t.id === toolId);
    if (tool && tool.isDragging) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setAngleTools((tools) =>
        tools.map((t) => (t.id === toolId ? { ...t, x, y } : t))
      );

      // Check if near any triangle vertex
      if (triangleData) {
        const threshold = 30;
        const vertices = Object.entries(triangleData.vertices);
        let attachedVertex = null;

        for (const [vertexName, vertex] of vertices) {
          const rotatedVertex = rotatePoint(
            vertex.x,
            vertex.y,
            350,
            175,
            rotation
          );
          const distance = Math.sqrt(
            (x - rotatedVertex.x) ** 2 + (y - rotatedVertex.y) ** 2
          );
          if (distance < threshold) {
            attachedVertex = vertexName;
            setAngleTools((tools) =>
              tools.map((t) =>
                t.id === toolId
                  ? {
                      ...t,
                      x: rotatedVertex.x,
                      y: rotatedVertex.y,
                      attachedVertex: vertexName,
                    }
                  : t
              )
            );
            break;
          }
        }

        if (!attachedVertex) {
          setAngleTools((tools) =>
            tools.map((t) =>
              t.id === toolId ? { ...t, attachedVertex: null } : t
            )
          );
        }
      }
    }
  };

  const handleAngleToolMouseUp = (toolId) => {
    setAngleTools((tools) =>
      tools.map((tool) =>
        tool.id === toolId ? { ...tool, isDragging: false } : tool
      )
    );
  };

  const rotatePoint = (x, y, centerX, centerY, angle) => {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nx = cos * (x - centerX) + sin * (y - centerY) + centerX;
    const ny = cos * (y - centerY) - sin * (x - centerX) + centerY;
    return { x: nx, y: ny };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
      angleTools.forEach((tool) => {
        if (tool.isDragging) {
          handleAngleToolMouseMove(e, tool.id);
        }
      });
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
      angleTools.forEach((tool) => {
        if (tool.isDragging) {
          handleAngleToolMouseUp(tool.id);
        }
      });
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, angleTools]);

  const renderTriangle = () => {
    if (!triangleData) return null;

    const { vertices, sides } = triangleData;
    const centerX = 350;
    const centerY = 175;

    const rotatedA = rotatePoint(
      vertices.A.x,
      vertices.A.y,
      centerX,
      centerY,
      rotation
    );
    const rotatedB = rotatePoint(
      vertices.B.x,
      vertices.B.y,
      centerX,
      centerY,
      rotation
    );
    const rotatedC = rotatePoint(
      vertices.C.x,
      vertices.C.y,
      centerX,
      centerY,
      rotation
    );

    const points = `${rotatedA.x},${rotatedA.y} ${rotatedB.x},${rotatedB.y} ${rotatedC.x},${rotatedC.y}`;

    // Calculate side midpoints for proper labeling
    const midAB = {
      x: (rotatedA.x + rotatedB.x) / 2,
      y: (rotatedA.y + rotatedB.y) / 2,
    };
    const midBC = {
      x: (rotatedB.x + rotatedC.x) / 2,
      y: (rotatedB.y + rotatedC.y) / 2,
    };
    const midCA = {
      x: (rotatedC.x + rotatedA.x) / 2,
      y: (rotatedC.y + rotatedA.y) / 2,
    };

    // Calculate normal vectors for label positioning
    const offsetDistance = 20;

    // For side AB (side c)
    const abVector = { x: rotatedB.x - rotatedA.x, y: rotatedB.y - rotatedA.y };
    const abLength = Math.sqrt(
      abVector.x * abVector.x + abVector.y * abVector.y
    );
    const abNormal = { x: -abVector.y / abLength, y: abVector.x / abLength };

    // For side BC (side a)
    const bcVector = { x: rotatedC.x - rotatedB.x, y: rotatedC.y - rotatedB.y };
    const bcLength = Math.sqrt(
      bcVector.x * bcVector.x + bcVector.y * bcVector.y
    );
    const bcNormal = { x: -bcVector.y / bcLength, y: bcVector.x / bcLength };

    // For side CA (side b)
    const caVector = { x: rotatedA.x - rotatedC.x, y: rotatedA.y - rotatedC.y };
    const caLength = Math.sqrt(
      caVector.x * caVector.x + caVector.y * caVector.y
    );
    const caNormal = { x: -caVector.y / caLength, y: caVector.x / caLength };

    return (
      <g>
        <polygon
          points={points}
          fill="rgba(74, 144, 226, 0.2)"
          stroke="#4A90E2"
          strokeWidth="3"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={(e) => handleMouseDown(e, true)}
        />

        {/* Side length labels with proper positioning and value-based coloring */}
        {/* Side c (AB) - between vertices A and B */}
        <text
          x={midAB.x + abNormal.x * offsetDistance}
          y={midAB.y + abNormal.y * offsetDistance + 5}
          textAnchor="middle"
          fill={
            parseFloat(sides.c) ===
            Math.max(
              parseFloat(sides.a),
              parseFloat(sides.b),
              parseFloat(sides.c)
            )
              ? "#E74C3C"
              : parseFloat(sides.c) ===
                Math.min(
                  parseFloat(sides.a),
                  parseFloat(sides.b),
                  parseFloat(sides.c)
                )
              ? "#27AE60"
              : "#2C3E50"
          }
          fontSize="14"
          fontWeight="bold"
        >
          c = {sides.c}{" "}
          {parseFloat(sides.c) ===
          Math.max(
            parseFloat(sides.a),
            parseFloat(sides.b),
            parseFloat(sides.c)
          )
            ? triangleData.isRightAngled
              ? "(hypotenuse)"
              : "(longest)"
            : parseFloat(sides.c) ===
              Math.min(
                parseFloat(sides.a),
                parseFloat(sides.b),
                parseFloat(sides.c)
              )
            ? "(shortest)"
            : ""}
        </text>

        {/* Side a (BC) - between vertices B and C */}
        <text
          x={midBC.x + bcNormal.x * offsetDistance}
          y={midBC.y + bcNormal.y * offsetDistance + 5}
          textAnchor="middle"
          fill={
            parseFloat(sides.a) ===
            Math.max(
              parseFloat(sides.a),
              parseFloat(sides.b),
              parseFloat(sides.c)
            )
              ? "#E74C3C"
              : parseFloat(sides.a) ===
                Math.min(
                  parseFloat(sides.a),
                  parseFloat(sides.b),
                  parseFloat(sides.c)
                )
              ? "#27AE60"
              : "#2C3E50"
          }
          fontSize="14"
          fontWeight="bold"
        >
          a = {sides.a}{" "}
          {parseFloat(sides.a) ===
          Math.max(
            parseFloat(sides.a),
            parseFloat(sides.b),
            parseFloat(sides.c)
          )
            ? triangleData.isRightAngled
              ? "(hypotenuse)"
              : "(longest)"
            : parseFloat(sides.a) ===
              Math.min(
                parseFloat(sides.a),
                parseFloat(sides.b),
                parseFloat(sides.c)
              )
            ? "(shortest)"
            : ""}
        </text>

        {/* Side b (CA) - between vertices C and A */}
        <text
          x={midCA.x + caNormal.x * offsetDistance}
          y={midCA.y + caNormal.y * offsetDistance + 5}
          textAnchor="middle"
          fill={
            parseFloat(sides.b) ===
            Math.max(
              parseFloat(sides.a),
              parseFloat(sides.b),
              parseFloat(sides.c)
            )
              ? "#E74C3C"
              : parseFloat(sides.b) ===
                Math.min(
                  parseFloat(sides.a),
                  parseFloat(sides.b),
                  parseFloat(sides.c)
                )
              ? "#27AE60"
              : "#2C3E50"
          }
          fontSize="14"
          fontWeight="bold"
        >
          b = {sides.b}{" "}
          {parseFloat(sides.b) ===
          Math.max(
            parseFloat(sides.a),
            parseFloat(sides.b),
            parseFloat(sides.c)
          )
            ? triangleData.isRightAngled
              ? "(hypotenuse)"
              : "(longest)"
            : parseFloat(sides.b) ===
              Math.min(
                parseFloat(sides.a),
                parseFloat(sides.b),
                parseFloat(sides.c)
              )
            ? "(shortest)"
            : ""}
        </text>

        {/* Vertices with right angle highlighting */}
        <circle
          cx={rotatedA.x}
          cy={rotatedA.y}
          r="6"
          fill={triangleData.rightAngleVertex === "A" ? "#E74C3C" : "#4A90E2"}
        />
        <circle
          cx={rotatedB.x}
          cy={rotatedB.y}
          r="6"
          fill={triangleData.rightAngleVertex === "B" ? "#E74C3C" : "#4A90E2"}
        />
        <circle
          cx={rotatedC.x}
          cy={rotatedC.y}
          r="6"
          fill={triangleData.rightAngleVertex === "C" ? "#E74C3C" : "#4A90E2"}
        />

        {/* Vertex labels */}
        <text
          x={rotatedA.x - 15}
          y={rotatedA.y + 5}
          fill="#2C3E50"
          fontSize="12"
          fontWeight="bold"
        >
          A{triangleData.rightAngleVertex === "A" ? " (90°)" : ""}
        </text>
        <text
          x={rotatedB.x + 10}
          y={rotatedB.y + 5}
          fill="#2C3E50"
          fontSize="12"
          fontWeight="bold"
        >
          B{triangleData.rightAngleVertex === "B" ? " (90°)" : ""}
        </text>
        <text
          x={rotatedC.x - 5}
          y={rotatedC.y - 10}
          fill="#2C3E50"
          fontSize="12"
          fontWeight="bold"
        >
          C{triangleData.rightAngleVertex === "C" ? " (90°)" : ""}
        </text>
      </g>
    );
  };

  const renderAngleTools = () => {
    return angleTools.map((tool) => (
      <g key={tool.id}>
        <circle
          cx={tool.x}
          cy={tool.y}
          r="20"
          fill="rgba(255, 193, 7, 0.8)"
          stroke="#FFC107"
          strokeWidth="2"
          style={{ cursor: tool.isDragging ? "grabbing" : "grab" }}
          onMouseDown={(e) => handleAngleToolMouseDown(e, tool.id)}
        />
        <text
          x={tool.x}
          y={tool.y + 5}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#2C3E50"
          style={{ pointerEvents: "none" }}
        >
          ∠{tool.id}
        </text>
        {tool.attachedVertex && triangleData && (
          <>
            <text
              x={tool.x}
              y={tool.y - 30}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill={
                Math.abs(triangleData.angles[tool.attachedVertex] - 90) < 1
                  ? "#E74C3C"
                  : "#FFC107"
              }
            >
              {triangleData.angles[tool.attachedVertex].toFixed(1)}°
            </text>
            {Math.abs(triangleData.angles[tool.attachedVertex] - 90) < 1 && (
              <text
                x={tool.x}
                y={tool.y - 45}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#E74C3C"
              >
                RIGHT ANGLE
              </text>
            )}
          </>
        )}
      </g>
    ));
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      background: "linear-gradient(90deg, #4A90E2 0%, #357ABD 100%)",
      height: "60px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    mainContainer: {
      display: "flex",
      minHeight: "calc(100vh - 60px)",
    },
    mainContent: {
      flex: 1,
      padding: "2rem",
      background: "rgba(255,255,255,0.95)",
      margin: "2rem",
      marginRight: "1rem",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      backdropFilter: "blur(10px)",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "bold",
      color: "#2C3E50",
      marginBottom: "2rem",
      textAlign: "center",
      background: "linear-gradient(90deg, #4A90E2, #764ba2)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    inputContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "2rem",
    },
    input: {
      width: "80px",
      padding: "0.75rem",
      border: "2px solid #ddd",
      borderRadius: "10px",
      textAlign: "center",
      fontSize: "1rem",
      fontWeight: "bold",
      transition: "all 0.3s ease",
      outline: "none",
    },
    inputFocus: {
      borderColor: "#4A90E2",
      boxShadow: "0 0 0 3px rgba(74, 144, 226, 0.1)",
    },
    button: {
      padding: "0.75rem 1.5rem",
      background: "linear-gradient(90deg, #4A90E2, #357ABD)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(74, 144, 226, 0.3)",
    },
    canvas: {
      background: "linear-gradient(145deg, #f8f9fa, #e9ecef)",
      borderRadius: "15px",
      padding: "1rem",
      border: "2px dashed #4A90E2",
      marginBottom: "1.5rem",
      boxShadow: "inset 0 2px 10px rgba(0,0,0,0.05)",
    },
    messageBox: {
      background: "linear-gradient(90deg, #667eea, #764ba2)",
      color: "white",
      padding: "1rem 2rem",
      borderRadius: "15px",
      fontSize: "1.1rem",
      fontWeight: "bold",
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
      minHeight: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    sidebar: {
      width: "300px",
      background: "linear-gradient(180deg, #26D0CE, #1A2980)",
      padding: "2rem",
      color: "white",
      margin: "2rem",
      marginLeft: "1rem",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    },
    sidebarTitle: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    angleToolCard: {
      background: "rgba(255,255,255,0.15)",
      borderRadius: "12px",
      padding: "1rem",
      marginBottom: "1rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    toolHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.5rem",
    },
    toolBadge: {
      width: "24px",
      height: "24px",
      background: "#FFC107",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
      fontWeight: "bold",
      color: "#2C3E50",
    },
    instructionsCard: {
      background: "rgba(255,255,255,0.15)",
      borderRadius: "12px",
      padding: "1rem",
      marginTop: "1.5rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    dataCard: {
      background: "rgba(255,255,255,0.15)",
      borderRadius: "12px",
      padding: "1rem",
      marginTop: "1rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    hint: {
      textAlign: "center",
      color: "#666",
      fontSize: "0.9rem",
      background: "rgba(74, 144, 226, 0.1)",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      display: "inline-block",
      marginBottom: "1rem",
    },
    zoomContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "2rem",
      padding: "1rem",
      background: "rgba(74, 144, 226, 0.1)",
      borderRadius: "15px",
    },
    zoomSlider: {
      width: "200px",
      height: "8px",
      borderRadius: "4px",
      background: "linear-gradient(90deg, #4A90E2, #357ABD)",
      outline: "none",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}></div>

      <div style={styles.mainContainer}>
        <div style={styles.mainContent}>
          <h1 style={styles.title}>Triangle Visualizer</h1>

          <div style={styles.inputContainer}>
            <input
              name="a"
              placeholder="Side a"
              value={sides.a}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#4A90E2")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
            <input
              name="b"
              placeholder="Side b"
              value={sides.b}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#4A90E2")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
            <input
              name="c"
              placeholder="Side c"
              value={sides.c}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#4A90E2")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
            {triangleData && (
              <div style={styles.zoomContainer}>
                <span style={{ fontWeight: "bold", color: "#4A90E2" }}>
                  🔍 Zoom:
                </span>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={handleZoomChange}
                  style={styles.zoomSlider}
                />
                <span style={{ fontWeight: "bold", color: "#4A90E2" }}>
                  {zoom.toFixed(1)}x
                </span>
              </div>
            )}
            <button
              onClick={handleSubmit}
              style={styles.button}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              Generate Triangle
            </button>
          </div>

          <div style={styles.canvas}>
            <svg
              ref={svgRef}
              width="700"
              height="350"
              style={{ width: "100%", height: "auto", userSelect: "none" }}
            >
              {renderTriangle()}
              {renderAngleTools()}
            </svg>
          </div>

          {triangleData && (
            <div style={styles.hint}>
              💡 Drag the triangle to rotate it • Drag angle tools to vertices
              to measure angles
            </div>
          )}

          <div style={styles.messageBox}>
            {message || "Enter three side lengths to create a triangle"}
          </div>
        </div>

        <div style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>🔧 Angle Tools</h2>

          {angleTools.map((tool) => (
            <div key={tool.id} style={styles.angleToolCard}>
              <div style={styles.toolHeader}>
                <span style={{ fontWeight: "bold" }}>Angle Tool {tool.id}</span>
                <div style={styles.toolBadge}>∠{tool.id}</div>
              </div>
              <p
                style={{ fontSize: "0.9rem", opacity: 0.9, margin: "0.5rem 0" }}
              >
                {tool.attachedVertex
                  ? `Attached to vertex ${tool.attachedVertex}`
                  : "Drag to triangle vertex"}
              </p>
              {tool.attachedVertex && triangleData && (
                <>
                  <p
                    style={{
                      color:
                        Math.abs(
                          triangleData.angles[tool.attachedVertex] - 90
                        ) < 1
                          ? "#E74C3C"
                          : "#FFC107",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      margin: 0,
                    }}
                  >
                    {triangleData.angles[tool.attachedVertex].toFixed(1)}°
                  </p>
                  {Math.abs(triangleData.angles[tool.attachedVertex] - 90) <
                    1 && (
                    <p
                      style={{
                        color: "#E74C3C",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        margin: "0.25rem 0 0 0",
                      }}
                    >
                      RIGHT ANGLE
                    </p>
                  )}
                </>
              )}
            </div>
          ))}

          <div style={styles.instructionsCard}>
            <h3 style={{ fontWeight: "bold", marginBottom: "0.75rem" }}>
              📐 Instructions
            </h3>
            <ul
              style={{
                fontSize: "0.9rem",
                opacity: 0.9,
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              <li style={{ marginBottom: "0.5rem" }}>
                • Enter three side lengths
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                • Drag triangle to rotate
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                • Drag yellow angle tools to vertices
              </li>
              <li>• View angle measurements instantly</li>
            </ul>
          </div>

          {triangleData && (
            <div style={styles.dataCard}>
              <h3 style={{ fontWeight: "bold", marginBottom: "0.75rem" }}>
                📊 Triangle Data
              </h3>
              <div style={{ fontSize: "0.9rem" }}>
                <p style={{ margin: "0.25rem 0" }}>
                  Side a: {triangleData.sides.a}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Side b: {triangleData.sides.b}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Side c: {triangleData.sides.c}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Area: {triangleData.area.toFixed(2)} sq. units
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  Perimeter: {triangleData.perimeter.toFixed(2)} units
                </p>
                <hr
                  style={{
                    margin: "0.75rem 0",
                    border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
                <p style={{ margin: "0.25rem 0" }}>
                  Rotation: {rotation.toFixed(1)}°
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
