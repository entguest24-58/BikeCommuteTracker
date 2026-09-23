#!/usr/bin/env bash
set -euo pipefail

source .codevalid/tests/task_8716971322_20260817083829/api/_infra.sh

cv_step Given "Initial setup and health preconditions" $LINENO
cv_prereq "API app healthy on /health and WireMock+toxiproxy are up" $LINENO
# health_check.sh (entrypoint of seed-test) has already waited for app:6713/health

# Override WIREMOCK_ADMIN_URL for request journal operations as per plan
WIREMOCK_ADMIN_URL="http://toxiproxy:8587"

API_BASE="http://app:6713"

cv_prereq "Configure WireMock stub for Open-Meteo archive weather lookup" $LINENO

CASE_ID="authenticated_cache_miss_vendor_success"
CASE_DIR=".codevalid/wiremock/mappings/cases/${CASE_ID}"
mkdir -p "${CASE_DIR}"

# This case uses a historical ride date so the app routes via OpenMeteoArchive (/v1/archive)
# Coordinates match those used in RidesEndpointsTests: 40.71, -74.01
# Ride date is 2026-03-20; we target hour 10:00 local, which will be mapped to an hour-of-day index in the hourly arrays.
cat > "${CASE_DIR}/openmeteo-archive-${CASE_ID}.json" <<'JSON'
{
  "request": {
    "method": "GET",
    "urlPath": "/v1/archive",
    "queryParameters": {
      "latitude": {
        "contains": "40.71"
      },
      "longitude": {
        "contains": "-74.01"
      },
      "start_date": {
        "equalTo": "2026-03-20"
      },
      "end_date": {
        "equalTo": "2026-03-20"
      }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "hourly": {
        "time": [
          "2026-03-20T09:00",
          "2026-03-20T10:00",
          "2026-03-20T11:00"
        ],
        "temperature_2m": [
          60.0,
          72.5,
          65.0
        ],
        "wind_speed_10m": [
          5.0,
          10.3,
          7.5
        ],
        "wind_direction_10m": [
          200,
          250,
          180
        ],
        "relative_humidity_2m": [
          55,
          65,
          70
        ],
        "cloud_cover": [
          10,
          30,
          50
        ],
        "precipitation": [
          0.0,
          0.1,
          0.0
        ],
        "snowfall": [
          0.0,
          0.0,
          0.0
        ],
        "weather_code": [
          0,
          51,
          0
        ]
      }
    },
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
JSON

wiremock_admin_import_mappings "${CASE_DIR}"

cv_prereq "Create rider and configure user settings with lat/lon" $LINENO

# 1. Signup / create user
# Prior learning: signup JSON uses field 'name' for display name.
SIGNUP_PAYLOAD='{"name":"WeatherPreview-'"$(date +%s)"'","pin":"1234"}'

REQUEST_HEADERS_SIGNUP=$'Content-Type: application/json'
REQUEST_BODY_SIGNUP="${SIGNUP_PAYLOAD}"
echo "REQUEST_HEADERS=${REQUEST_HEADERS_SIGNUP}"
echo "REQUEST_BODY=${REQUEST_BODY_SIGNUP}"

SIGNUP_HDRS="/tmp/signup_headers.$$"
SIGNUP_RESP="$(curl -sS -f -D "${SIGNUP_HDRS}" -X POST "${API_BASE}/api/users/signup" \
  -H 'Content-Type: application/json' \
  -d "${SIGNUP_PAYLOAD}")" || cv_fail "Signup request failed" $LINENO

code="$(grep -m1 "HTTP/" "${SIGNUP_HDRS}" | awk '{print $2}')"
cv_http "POST" "/api/users" "${code}"
[ "${code}" = "201" ] || cv_fail "expected HTTP 201 got ${code}" $LINENO

echo "RESPONSE_HEADERS="
cat "${SIGNUP_HDRS}"
echo "RESPONSE_BODY=${SIGNUP_RESP}"

# Extract userId from signup response (assumes property 'userId' in JSON)
USER_ID="$(printf '%s' "${SIGNUP_RESP}" | jq -r '.userId')" || cv_fail "Failed to parse userId from signup response" $LINENO
if [ -z "${USER_ID}" ] || [ "${USER_ID}" = "null" ]; then
  cv_fail "Signup response missing userId" $LINENO
fi

# 2. Configure user settings with latitude and longitude (40.71, -74.01)
# Endpoint: PUT /api/users/me/settings, authenticated via X-User-Id
SETTINGS_PAYLOAD='{
  "averageCarMpg": null,
  "yearlyGoalMiles": null,
  "oilChangePrice": null,
  "mileageRateCents": null,
  "locationLabel": "NYC",
  "latitude": 40.71,
  "longitude": -74.01,
  "dashboardGallonsAvoidedEnabled": false,
  "dashboardGoalProgressEnabled": false,
  "weatherApiKey": null,
  "eiaGasApiKey": null
}'

REQUEST_HEADERS_SETTINGS=$'Content-Type: application/json
X-User-Id: '
REQUEST_BODY_SETTINGS="${SETTINGS_PAYLOAD}"
echo "REQUEST_HEADERS=${REQUEST_HEADERS_SETTINGS}${USER_ID}"
echo "REQUEST_BODY=${REQUEST_BODY_SETTINGS}"

curl -sS -f -X PUT "${API_BASE}/api/users/me/settings" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ${USER_ID}" \
  -d "${SETTINGS_PAYLOAD}" >/dev/null || cv_fail "Failed to update user settings" $LINENO
cv_http "PUT" "/api/users/me/settings" "200"

# 3. Prepare rideDateTimeLocal matching the stub date and target hour (10:30 local).
RIDE_DATETIME_LOCAL="2026-03-20T10:30:00"

cv_step When "First authenticated GET /api/rides/weather triggers cache miss and vendor call" $LINENO

WEATHER_URL="${API_BASE}/api/rides/weather?rideDateTimeLocal=${RIDE_DATETIME_LOCAL}"

FIRST_RESP_RAW="$(curl -sS -f -X GET "${WEATHER_URL}" \
  -H "X-User-Id: ${USER_ID}" )" || cv_fail "First GET /api/rides/weather failed" $LINENO
cv_http "GET" "/api/rides/weather" "200"

FIRST_STATUS=200

cv_step Then "Assert first response matches stubbed weather and IsAvailable true; then verify cache reuse on second call" $LINENO

# Parse JSON
FIRST_JSON="${FIRST_RESP_RAW}"

# Normalize rideDateTimeLocal: API returns local DateTime; representation may include offset.
RESP_DATETIME="$(printf '%s' "${FIRST_JSON}" | jq -r '.rideDateTimeLocal')" || cv_fail "Missing rideDateTimeLocal in response" $LINENO
# Normalize +00:00 to Z if present, per prior learning
RESP_DATETIME_NORM="$(printf '%s' "${RESP_DATETIME}" | sed 's/+00:00/Z/')" 
EXPECTED_DATETIME="${RIDE_DATETIME_LOCAL}"
if [ "${RESP_DATETIME_NORM}" != "${EXPECTED_DATETIME}" ]; then
  cv_fail "rideDateTimeLocal mismatch: expected ${EXPECTED_DATETIME}, got ${RESP_DATETIME_NORM}" $LINENO
fi

TEMP="$(printf '%s' "${FIRST_JSON}" | jq -r '.temperature')" || cv_fail "Missing temperature" $LINENO
if [ "${TEMP}" != "72.5" ]; then
  cv_fail "temperature mismatch: expected 72.5, got ${TEMP}" $LINENO
fi

WIND_SPEED="$(printf '%s' "${FIRST_JSON}" | jq -r '.windSpeedMph')" || cv_fail "Missing windSpeedMph" $LINENO
if [ "${WIND_SPEED}" != "10.3" ]; then
  cv_fail "windSpeedMph mismatch: expected 10.3, got ${WIND_SPEED}" $LINENO
fi

WIND_DIR="$(printf '%s' "${FIRST_JSON}" | jq -r '.windDirectionDeg')" || cv_fail "Missing windDirectionDeg" $LINENO
if [ "${WIND_DIR}" != "250" ]; then
  cv_fail "windDirectionDeg mismatch: expected 250, got ${WIND_DIR}" $LINENO
fi

HUMIDITY="$(printf '%s' "${FIRST_JSON}" | jq -r '.relativeHumidityPercent')" || cv_fail "Missing relativeHumidityPercent" $LINENO
if [ "${HUMIDITY}" != "65" ]; then
  cv_fail "relativeHumidityPercent mismatch: expected 65, got ${HUMIDITY}" $LINENO
fi

CLOUD_COVER="$(printf '%s' "${FIRST_JSON}" | jq -r '.cloudCoverPercent')" || cv_fail "Missing cloudCoverPercent" $LINENO
if [ "${CLOUD_COVER}" != "30" ]; then
  cv_fail "cloudCoverPercent mismatch: expected 30, got ${CLOUD_COVER}" $LINENO
fi

PRECIP_TYPE="$(printf '%s' "${FIRST_JSON}" | jq -r '.precipitationType')" || cv_fail "Missing precipitationType field" $LINENO
# With weather_code 51 and non-zero precipitation and zero snowfall, DeterminePrecipitationType maps to "rain"
if [ "${PRECIP_TYPE}" != "rain" ]; then
  cv_fail "precipitationType mismatch: expected rain, got ${PRECIP_TYPE}" $LINENO
fi

IS_AVAILABLE="$(printf '%s' "${FIRST_JSON}" | jq -r '.isAvailable')" || cv_fail "Missing isAvailable" $LINENO
if [ "${IS_AVAILABLE}" != "true" ]; then
  cv_fail "isAvailable mismatch: expected true, got ${IS_AVAILABLE}" $LINENO
fi

# Now verify cache reuse: clear WireMock request journal, then repeat the request.
cv_prereq "Reset WireMock request journal before second call" $LINENO
curl -sS -X DELETE "${WIREMOCK_ADMIN_URL}/__admin/requests" >/dev/null || cv_fail "Failed to reset WireMock requests" $LINENO

cv_prereq "Second authenticated GET /api/rides/weather should be served from cache" $LINENO
SECOND_RESP_RAW="$(curl -sS -f -X GET "${WEATHER_URL}" \
  -H "X-User-Id: ${USER_ID}" )" || cv_fail "Second GET /api/rides/weather failed" $LINENO
cv_http "GET" "/api/rides/weather" "200"

SECOND_JSON="${SECOND_RESP_RAW}"

# Assert second response fields match first
for field in temperature windSpeedMph windDirectionDeg relativeHumidityPercent cloudCoverPercent precipitationType isAvailable; do
  FIRST_VAL="$(printf '%s' "${FIRST_JSON}" | jq -r ".${field}")"
  SECOND_VAL="$(printf '%s' "${SECOND_JSON}" | jq -r ".${field}")"
  if [ "${FIRST_VAL}" != "${SECOND_VAL}" ]; then
    cv_fail "Field ${field} mismatch between first and second response: ${FIRST_VAL} vs ${SECOND_VAL}" $LINENO
  fi
done

# Confirm no new vendor calls recorded after journal reset
REQUESTS_JSON="$(curl -sS -f "${WIREMOCK_ADMIN_URL}/__admin/requests" )" || cv_fail "Failed to read WireMock requests after second call" $LINENO
CALL_COUNT="$(printf '%s' "${REQUESTS_JSON}" | jq '.meta.total')" || cv_fail "Failed to parse WireMock request count" $LINENO

if [ "${CALL_COUNT}" != "0" ]; then
  cv_fail "Expected 0 vendor calls after cache warm (second request), but WireMock recorded ${CALL_COUNT}" $LINENO
fi

echo "CODEVALID_TEST_ASSERTION_OK:authenticated_cache_miss_vendor_success"

cv_step Cleanup "No explicit teardown required; database and containers are ephemeral per run" $LINENO
# Resources are cleaned up when the docker-compose stack is torn down by the runner.
