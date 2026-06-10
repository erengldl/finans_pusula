$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-BrandBitmap {
  param(
    [int]$Size
  )

  $scale = $Size / 256.0
  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $mint = [System.Drawing.ColorTranslator]::FromHtml("#ECFDF5")
  $darkGreen = [System.Drawing.ColorTranslator]::FromHtml("#166534")
  $tick = [System.Drawing.ColorTranslator]::FromHtml("#BBF7D0")
  $greenLight = [System.Drawing.ColorTranslator]::FromHtml("#22C55E")
  $greenMid = [System.Drawing.ColorTranslator]::FromHtml("#16A34A")
  $greenDeep = [System.Drawing.ColorTranslator]::FromHtml("#15803D")
  $gold = [System.Drawing.ColorTranslator]::FromHtml("#F59E0B")
  $white = [System.Drawing.Color]::White

  $backgroundPath = New-RoundedRectanglePath -X (14 * $scale) -Y (14 * $scale) -Width (228 * $scale) -Height (228 * $scale) -Radius (56 * $scale)
  $graphics.FillPath((New-Object System.Drawing.SolidBrush $mint), $backgroundPath)

  $ringPen = New-Object System.Drawing.Pen $darkGreen, (16 * $scale)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $white), 54 * $scale, 54 * $scale, 148 * $scale, 148 * $scale)
  $graphics.DrawEllipse($ringPen, 54 * $scale, 54 * $scale, 148 * $scale, 148 * $scale)

  $tickPen = New-Object System.Drawing.Pen $tick, (10 * $scale)
  $tickPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $tickPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($tickPen, 128 * $scale, 52 * $scale, 128 * $scale, 68 * $scale)
  $graphics.DrawLine($tickPen, 128 * $scale, 188 * $scale, 128 * $scale, 204 * $scale)
  $graphics.DrawLine($tickPen, 52 * $scale, 128 * $scale, 68 * $scale, 128 * $scale)
  $graphics.DrawLine($tickPen, 188 * $scale, 128 * $scale, 204 * $scale, 128 * $scale)

  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $greenLight), 84 * $scale, 164 * $scale, 18 * $scale, 22 * $scale)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $greenMid), 110 * $scale, 142 * $scale, 18 * $scale, 44 * $scale)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $greenDeep), 136 * $scale, 120 * $scale, 18 * $scale, 66 * $scale)

  $arrowPoints = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(168 * $scale, 82 * $scale),
    [System.Drawing.PointF]::new(184 * $scale, 98 * $scale),
    [System.Drawing.PointF]::new(135 * $scale, 147 * $scale),
    [System.Drawing.PointF]::new(147 * $scale, 159 * $scale),
    [System.Drawing.PointF]::new(100 * $scale, 168 * $scale),
    [System.Drawing.PointF]::new(109 * $scale, 122 * $scale),
    [System.Drawing.PointF]::new(121 * $scale, 134 * $scale)
  )
  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush $gold), $arrowPoints)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $darkGreen), 119 * $scale, 119 * $scale, 18 * $scale, 18 * $scale)

  $graphics.Dispose()
  return $bitmap
}

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$faviconPath = Join-Path $workspace "src/app/favicon.ico"
$appleIconPath = Join-Path $workspace "src/app/apple-icon.png"

$appleBitmap = New-BrandBitmap -Size 180
$appleBitmap.Save($appleIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$appleBitmap.Dispose()

$faviconBitmap = New-BrandBitmap -Size 64
$memory = New-Object System.IO.MemoryStream
$faviconBitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
$faviconBitmap.Dispose()
$pngBytes = $memory.ToArray()
$memory.Dispose()

$writer = [System.IO.BinaryWriter]::new([System.IO.File]::Open($faviconPath, [System.IO.FileMode]::Create))
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]1)
$writer.Write([byte]64)
$writer.Write([byte]64)
$writer.Write([byte]0)
$writer.Write([byte]0)
$writer.Write([uint16]1)
$writer.Write([uint16]32)
$writer.Write([uint32]$pngBytes.Length)
$writer.Write([uint32]22)
$writer.Write($pngBytes)
$writer.Dispose()
