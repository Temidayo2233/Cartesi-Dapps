
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function HexToString(hex) {
  return ethers.toUtf8String(hex);
}

function StringToHex(payload) {
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

function isNumber(num) {
  return !isNaN(num);
}

const calculateAreaofTriangle = (a, b, c) => {
  const perimeter = (a+b+c)/2;
  const product = perimeter * (perimeter - a) * (perimeter - b) * (perimeter -c);
  const result = Math.sqrt(product);
  return result
}


async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const payload = HexToString(data["payload"]);
  const arrOfPayload = payload.split(" ");

  if (arrOfPayload.length !== 3 || !isNumber(arrOfPayload[0]) || !isNumber(arrOfPayload[1]) || !isNumber(arrOfPayload[2])) {
    const report_req = await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: StringToHex("Invalid format. Provide three numbers: <a> <b> <c>") }),
    });

    return "reject";
  }

  const a = parseInt(arrOfPayload[0]);
  const b = parseInt(arrOfPayload[1]);
  const c = parseInt(arrOfPayload[2]);

  const result = calculateAreaofTriangle(a, b, c);

  const notice_req = await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: StringToHex(result) }),
  });

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = HexToString(payload);

  const responseObject = "Inspect route not implemented for caluclating area of triangle with all given lengths";

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: StringToHex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();