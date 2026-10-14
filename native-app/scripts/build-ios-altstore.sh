#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'This device build requires macOS and Xcode (the GitHub workflow supplies them).' >&2
  exit 1
fi
export CI=1 EXPO_NO_TELEMETRY=1
xcodebuild -version
npx expo prebuild --platform ios --no-install
(cd ios && pod install)
workspace=$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)
test -n "$workspace"
scheme=$(basename "$workspace" .xcworkspace)
output="$PWD/build-altstore"
mkdir -p "$output"
xcodebuild -workspace "$workspace" -scheme "$scheme" \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath "$output/DerivedData" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' \
  build > "$output/xcodebuild.log" 2>&1 || {
    tail -n 120 "$output/xcodebuild.log"
    exit 1
  }
app=$(find "$output/DerivedData/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' -print -quit)
test -n "$app"
test -f "$app/main.jsbundle"
executable=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$app/Info.plist")
lipo -verify_arch arm64 "$app/$executable"
python3 - "$app/Info.plist" <<'PY'
import plistlib, sys
with open(sys.argv[1], 'rb') as f:
    info = plistlib.load(f)
assert info.get('CFBundleIdentifier') == 'com.altahdir.management'
assert 'iPhoneOS' in info.get('CFBundleSupportedPlatforms', [])
print('Verified device build:', info['CFBundleIdentifier'], 'minimum iOS:', info.get('MinimumOSVersion'))
PY
package=$(mktemp -d)
trap 'rm -rf "$package"' EXIT
mkdir "$package/Payload"
ditto "$app" "$package/Payload/$(basename "$app")"
(cd "$package" && /usr/bin/zip -qry "$output/altahdir-management-altstore-unsigned.ipa" Payload)
shasum -a 256 "$output/altahdir-management-altstore-unsigned.ipa" > "$output/SHA256.txt"
echo 'Unsigned device IPA created. AltStore must sign it on the owner’s computer before use.'
