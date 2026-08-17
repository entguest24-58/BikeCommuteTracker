import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

function makeAuthSession() {
  const now = new Date().toISOString();
  return {
    userId: 101,
    userName: "codevalid-user",
    lastActivityAtUtc: now,
    expiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

async function seedAuthenticatedSession(page, session = makeAuthSession()) {
  await page.addInitScript((payload) => {
    window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify(payload));
  }, session);
}

async function mockSettingsPageBootstrap(page) {
  await page.route("**/api/users/me/settings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hasSettings: true,
        settings: {
          averageCarMpg: null,
          yearlyGoalMiles: null,
          oilChangePrice: null,
          mileageRateCents: null,
          locationLabel: null,
          latitude: null,
          longitude: null,
          dashboardGallonsAvoidedEnabled: false,
          dashboardGoalProgressEnabled: false,
          weatherApiKey: null,
          eiaGasApiKey: null,
        },
      }),
    });
  });

  await page.route("**/api/ride-presets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ presets: [] }),
    });
  });
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function deflateRaw(buffer) {
  const ds = new CompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  await writer.write(buffer);
  await writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

function concatUint8Arrays(arrays) {
  const total = arrays.reduce((sum, item) => sum + item.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const item of arrays) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}

async function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const compressed = await deflateRaw(dataBytes);
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 8, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, compressed.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, compressed);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, 8, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, compressed.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + compressed.length;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const localDirectory = concatUint8Arrays(localParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, localDirectory.length, true);

  return Buffer.from(concatUint8Arrays([localDirectory, centralDirectory, end]));
}

async function unzipEntries(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const entries = [];
  let offset = 0;

  while (offset + 4 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    if (view.getUint32(0, true) !== 0x04034b50) break;
    const compressionMethod = view.getUint16(8, true);
    const compressedSize = view.getUint32(18, true);
    const fileNameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    const fileName = decoder.decode(bytes.slice(nameStart, nameEnd));
    const compressed = bytes.slice(dataStart, dataEnd);

    const ds = new DecompressionStream(compressionMethod === 8 ? "deflate-raw" : "deflate-raw");
    const writer = ds.writable.getWriter();
    await writer.write(compressed);
    await writer.close();
    const text = decoder.decode(new Uint8Array(await new Response(ds.readable).arrayBuffer())).replace(/\r\n/g, "\n");
    entries.push({ name: fileName, text });
    offset = dataEnd;
  }

  return entries;
}

test("export_ride_history_no_data_generates_zip_with_header_only_csv", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "export_ride_history_no_data_generates_zip_with_header_only_csv",
    testTitle: "Export Ride History with no rides generates ZIP with header-only CSV",
  });

  let download;

  await recorder.step("Seed authenticated session and mock ride export with a header-only yearly CSV", async () => {
    await seedAuthenticatedSession(page);
    await mockSettingsPageBootstrap(page);
    await page.route("**/api/exports/rides", async (route) => {
      const zip = await createZip([
        {
          name: "2024.csv",
          content: "RideDate,Miles,StartLocation,Notes,CreatedAtUtc\r\n",
        },
      ]);
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/zip" },
        body: zip,
      });
    });
  });

  await recorder.step("Click Export Ride History", async () => {
    await page.goto("/settings");
    [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Ride History" }).click(),
    ]);
  });

  await recorder.step("Verify ZIP contains a single header-only CSV", async () => {
    await expect(download.suggestedFilename()).toBe("ride-history-export.zip");
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const entries = await unzipEntries(Buffer.concat(chunks));
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("2024.csv");
    expect(entries[0].text.trimEnd().split("\n")).toEqual([
      "RideDate,Miles,StartLocation,Notes,CreatedAtUtc",
    ]);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:export_ride_history_no_data_generates_zip_with_header_only_csv");
  await recorder.save(testInfo);
});
