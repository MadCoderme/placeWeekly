import { useEffect, useState } from "react";
import "./styles.css";
import { AiOutlineMenu } from "react-icons/ai";
import { AiOutlineDownload } from "react-icons/ai";

import { initializeApp } from "@firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  increment,
  get,
  onChildChanged,
  child,
  onChildAdded
} from "@firebase/database";
import {
  TransformWrapper,
  TransformComponent
} from "@tiendeo/react-zoom-pan-pinch";
import canvasToImage from "canvas-to-image";

export default function App() {
  const [pixels, setPixels] = useState([]);
  const [colorPallate, setColorPallate] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activePixel, setActivePixel] = useState(-1);
  const [chosenColor, setChosenColor] = useState("");
  const [current, setCurrent] = useState(0);
  const [isPlacing, setPlacing] = useState(false);
  const [coolDown, setCoolDown] = useState(10);
  const [isClose, setClose] = useState(false);

  const availColors = [
    "#ff4500",
    "#ffa800",
    "#ffd635",
    "#00a368",
    "#7eed56",
    "#2450a4",
    "#3690ea",
    "#51e9f4",
    "#811e9f",
    "#ff99aa",
    "#9c6926",
    "black",
    "gray",
    "white"
  ];

  const firebaseConfig = {
    //your firebase config data
  };
  initializeApp(firebaseConfig);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (!name) {
      let input = prompt("What is your name?");
      if (input) {
        localStorage.setItem("userName", input);
      } else {
        localStorage.setItem("userName", "Anonymous");
      }
    }

    const db = getDatabase();

    get(child(ref(db), "pixels/")).then((snapshot) => {
      setPixels(snapshot.val());
    });

    get(child(ref(db), "cooldown")).then((snapshot) => {
      setCoolDown(snapshot.val());
    });

    get(child(ref(db), "endTime")).then((snapshot) => {
      let t = snapshot.val();
      if (t < +new Date()) {
        setClose(true);
      } else {
        load();
      }
    });

    const updates = {};
    updates["/currentlyOnline"] = increment(1);
    update(ref(db), updates);

    window.onbeforeunload = () => {
      const db = getDatabase();
      const updates = {};
      updates["/currentlyOnline"] = increment(-2);

      update(ref(db), updates);
    };
  }, []);

  useEffect(() => {
    if (!isClose) {
      const ctx = document.getElementById("canvas1").getContext("2d");
      ctx.imageSmoothingEnabled = false;
    }
  }, []);

  function load() {
    const db = getDatabase();

    onValue(ref(db, "pixels/"), (snapshot) => {
      setPixels(snapshot.val());
    });

    onChildAdded(ref(db, `pixels/`), (snapshot) => {
      const data = snapshot.val();
      updateTile(data, snapshot.key);
    });

    onChildChanged(ref(db, `pixels/`), (snapshot) => {
      const data = snapshot.val();
      updateTile(data, snapshot.key);
    });

    const oRef = ref(db, "currentlyOnline");
    onValue(oRef, (snapshot) => {
      const data = snapshot.val();
      setCurrent(data);
    });
  }

  useEffect(() => {
    if (!pixels[activePixel]) {
      pixels[activePixel] = { color: "white", temp: true };
    }
    updateTile(
      { color: chosenColor, user: localStorage.getItem("user") },
      activePixel
    );
  }, [chosenColor]);

  function updateTile(data, index) {
    if (data) {
      if (data.color !== "white" || data.color !== "#fff") {
        var ctx = document.getElementById("canvas1").getContext("2d");
        var y = parseInt(index / 1000);
        var x = index - y * 1000;

        if (ctx.fillStyle !== data.color) {
          ctx.fillStyle = data.color ? data.color : "white";
        }

        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function removeColor(pixel) {
    updateTile(
      pixels[pixel] ? pixels[pixel] : { user: "", color: "white" },
      pixel
    );
  }

  function detectClick(e) {
    const c = document.getElementById("canvas1");

    var boundingRect = e.target.getBoundingClientRect();
    var ex = e.clientX - boundingRect.left;
    var ey = e.clientY - boundingRect.top;
    var x = (ex * c.width) / boundingRect.width;
    var y = (ey * c.height) / boundingRect.height;

    var xPixel = Math.floor(x);
    var yPixel = Math.floor(y);

    let pixelIndex = yPixel * 1000 + xPixel;
    console.log(pixelIndex);

    if (pixels[activePixel]) {
      if (pixels[activePixel].color !== chosenColor) {
        updateTile(pixels[activePixel], activePixel);
      }
    }
    setActivePixel(pixelIndex);
    chooseColor(
      pixelIndex,
      pixels[pixelIndex] ? pixels[pixelIndex] : { color: "white" }
    );
  }

  function chooseColor(el, c) {
    if (localStorage.getItem("lastTime")) {
      let time = parseInt(localStorage.getItem("lastTime"));
      let diff = +new Date() - time;
      if (diff > 1000 * coolDown) {
        setColorPallate(true);
        setActivePixel(el);
        setChosenColor(c?.color);
      } else {
        alert(
          "Still " +
            (coolDown - diff / 1000).toFixed(1) +
            " seconds to place next tile!"
        );
      }
    } else {
      setColorPallate(true);
      setActivePixel(el);
      setChosenColor(c.color);
    }
  }

  function setColor(color) {
    setChosenColor(color);
  }

  function finalizeColor() {
    const db = getDatabase();
    const dbRef = ref(db);
    get(child(dbRef, "/pixels/" + activePixel)).then((snapshot) => {
      if (!snapshot.exists()) {
        set(ref(db, "/pixels/" + activePixel), {
          color: chosenColor,
          user: localStorage.getItem("userName"),
          totalEdits: increment(1)
        });
      } else {
        const updates = {};
        updates["/pixels/" + activePixel] = {
          color: chosenColor,
          user: localStorage.getItem("userName"),
          totalEdits: increment(1)
        };

        update(ref(db), updates);
      }
    });

    localStorage.setItem("lastTime", (+new Date()).toString());
    setColorPallate(false);
    setPlacing(false);
  }

  return !isClose ? (
    <div
      style={{
        backgroundColor: "#cdcdcd",
        overflow: "hidden"
      }}
      className="container"
      id="container"
    >
      <TransformWrapper limitToBounds={false} minScale={0.5} maxScale={15}>
        <TransformComponent>
          <div
            style={{
              margin: 0,
              height: "97vh",
              width: "100vw"
            }}
            id="canvas"
          >
            <canvas
              id="canvas1"
              height="1000"
              width="1000"
              style={{
                cursor: "crosshair",
                backgroundColor: "white"
              }}
              onClick={(e) => isPlacing && detectClick(e)}
            ></canvas>
          </div>
        </TransformComponent>
      </TransformWrapper>

      {colorPallate ? (
        <div
          style={{
            width: "90%",
            padding: 10,
            paddingRight: 20,
            paddingLeft: 20,
            zIndex: 10,
            position: "absolute",
            backgroundColor: "#f2f2f2",
            borderRadius: 20,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            bottom: 0,
            left: "4%"
          }}
          className="colorchooser"
        >
          <p
            style={{
              fontFamily: "arial",
              marginLeft: 10
            }}
          >
            By{" "}
            <b>{pixels[activePixel] ? pixels[activePixel].user : "Unknown"}</b>{" "}
            | Edited{" "}
            <b>{pixels[activePixel] ? pixels[activePixel].totalEdits : 0}</b>{" "}
            times
          </p>
          {availColors.map((color) => {
            return (
              <button
                className="colorOption"
                style={{
                  backgroundColor: color,
                  borderRadius: 15,
                  borderColor: color === "white" ? "black" : null,
                  borderWidth: 1
                }}
                onClick={() => setColor(color)}
              ></button>
            );
          })}
          <br />
          <div
            style={{
              marginLeft: "auto",
              marginRight: "auto"
            }}
          >
            <button
              style={{
                borderWidth: 0,
                fontSize: 32,
                borderRadius: 5,
                marginRight: 10,
                paddingLeft: 10,
                paddingRight: 10
              }}
              className="colorbtn"
              onClick={() => finalizeColor()}
            >
              &#10003;
            </button>
            <button
              style={{
                borderWidth: 0,
                fontSize: 30,
                borderRadius: 5,
                padding: 5,
                marginRight: 10,
                paddingLeft: 10,
                paddingRight: 10
              }}
              className="colorbtn"
              onClick={() => {
                setColorPallate(false);
                removeColor(activePixel);
                setActivePixel(-1);
              }}
            >
              X
            </button>
          </div>
        </div>
      ) : null}

      <div className="peoplePlaceholder">
        <p
          style={{
            color: "white",
            fontFamily: "arial"
          }}
        >
          {current} people
        </p>
      </div>
      {colorPallate ? (
        <p className="TileCoordbtn">
          {activePixel -
            parseInt(activePixel / 1000) * 1000 +
            ", " +
            parseInt(activePixel / 1000)}
        </p>
      ) : null}
      {colorPallate ? null : (
        <button
          style={{
            backgroundColor: isPlacing ? "gray" : "#ff4500",
            color: "white"
          }}
          className="placeTilebtn"
          onClick={() => {
            setPlacing((prev) => !prev);
            setColorPallate(false);
            activePixel && removeColor(activePixel);
            setActivePixel(-1);
          }}
        >
          {isPlacing ? "Tap to Cancel" : "Place Tile"}
        </button>
      )}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 30,
          padding: 15,
          background: "#ff4500",
          borderRadius: 20,
          zIndex: 10
        }}
        className="optionsbtn"
        onClick={() => setShowOptions((prev) => !prev)}
      >
        <AiOutlineMenu style={{ height: 20, width: 30 }} />
      </div>
      {showOptions ? (
        <div
          style={{
            padding: 20,
            backgroundColor: "#f2f2f2",
            position: "absolute",
            top: 80,
            left: 30,
            borderRadius: 15,
            zIndex: 20,
            boxShadow: 2
          }}
        >
          <p>Hi! 👋</p>
          <p>
            This site is built by{" "}
            <a href="https://github.com/MadCoderme">MadCoderme</a>
          </p>
          <p>It's a clone of r/Place, opened Weekly</p>
          <p>
            Join{" "}
            <a href="https://www.reddit.com/r/placeWeekly/">r/placeWeekly</a> to
            join next week!
          </p>
          <p>
            Currently, it has <b>1,000,000 pixels(1000x1000)</b>
          </p>
          <b>More features will be added soon...</b>
          <p>
            <b>Report Bug:</b> Abrar#7757
          </p>
          <br />
          <br />
          <hr />
          <button
            style={{
              background: "transparent",
              borderWidth: 0,
              alignSelf: "center",
              cursor: "pointer"
            }}
            onClick={() => {
              canvasToImage("canvas1", {
                name: "placeWeekly Canvas",
                type: "png",
                quality: 1
              });
            }}
          >
            <AiOutlineDownload style={{ fontSize: 30 }} />
            <p>Download Canvas Image</p>
          </button>
        </div>
      ) : null}
    </div>
  ) : (
    <div
      style={{
        backgroundColor: "#041C32",
        overflow: "hidden",
        height: "98vh",
        width: "95vw",
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        verticalAlign: "center"
      }}
    >
      <h1
        style={{
          color: "white",
          marginTop: 30,
          textAlign: "center",
          fontWeight: "bold"
        }}
      >
        PlaceWeekly has Ended!
      </h1>
      <h3
        style={{
          color: "white",
          textAlign: "center"
        }}
      >
        Join{" "}
        <a
          href="https://reddit.com/r/placeWeekly"
          style={{
            textDecoration: "none"
          }}
        >
          r/placeWeekly
        </a>{" "}
        to know about next Place
      </h3>
    </div>
  );
}
