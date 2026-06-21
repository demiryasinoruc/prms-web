import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Leaflet'in varsayılan marker ikonu Vite/bundler ortamında kırılır
// (ikon görsellerinin yolu çözümlenemez). Görselleri import edip
// L.Icon.Default ile birleştirerek bu bilinen bug'ı çözüyoruz.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

// Türkiye geneli varsayılan merkez ve düşük zoom (konum seçilmemişse)
const DEFAULT_CENTER: [number, number] = [39.0, 35.0]
const DEFAULT_ZOOM = 5
const SELECTED_ZOOM = 13

interface LocationPickerMapProps {
  latitude: number | null
  longitude: number | null
  onChange?: (lat: number, lng: number) => void
  readonly?: boolean
}

// Harita üzerinde tıklamayı yakalar (sadece düzenlenebilir modda)
function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Konum değiştiğinde haritayı o noktaya kaydırır
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), SELECTED_ZOOM))
  }, [lat, lng, map])
  return null
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  readonly = false,
}: LocationPickerMapProps) {
  const markerRef = useRef<L.Marker | null>(null)

  const hasPosition =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  const center: [number, number] = hasPosition
    ? [latitude as number, longitude as number]
    : DEFAULT_CENTER
  const zoom = hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM

  const dragHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker && onChange) {
          const { lat, lng } = marker.getLatLng()
          onChange(lat, lng)
        }
      },
    }),
    [onChange],
  )

  return (
    <div className="h-72 w-full overflow-hidden rounded-md border">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={!readonly}
        dragging={!readonly}
        doubleClickZoom={!readonly}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readonly && onChange && <ClickHandler onChange={onChange} />}
        {hasPosition && (
          <>
            <Marker
              position={[latitude as number, longitude as number]}
              icon={defaultIcon}
              draggable={!readonly}
              eventHandlers={readonly ? undefined : dragHandlers}
              ref={markerRef}
            />
            <RecenterOnChange lat={latitude as number} lng={longitude as number} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
