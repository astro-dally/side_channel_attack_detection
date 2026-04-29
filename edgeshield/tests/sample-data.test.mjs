import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import worker from "../src/index.js";

async function evaluateDataset(content, contentType) {
  const response = await worker.fetch(
    new Request("http://example.test/dataset/test", {
      method: "POST",
      headers: { "content-type": contentType },
      body: content
    }),
    {},
    { waitUntil() {} }
  );
  return { response, body: await response.json() };
}

test("sample CSV dataset matches the documented upload format", async () => {
  const csv = await readFile(new URL("../docs/sample-dataset.csv", import.meta.url), "utf8");
  const { response, body } = await evaluateDataset(csv, "text/csv");

  assert.equal(response.status, 200);
  assert.equal(body.total_rows, 8);
  assert.equal(body.evaluated_rows, 8);
  assert.equal(body.accuracy, 1);
});

test("sample JSON dataset matches the documented upload format", async () => {
  const json = await readFile(new URL("../docs/sample-dataset.json", import.meta.url), "utf8");
  const { response, body } = await evaluateDataset(json, "application/json");

  assert.equal(response.status, 200);
  assert.equal(body.total_rows, 4);
  assert.equal(body.evaluated_rows, 4);
  assert.equal(body.accuracy, 1);
});
