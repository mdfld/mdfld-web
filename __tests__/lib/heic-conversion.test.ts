import { describe, it, expect, vi, beforeEach } from "vitest";
import { convertHeicFile } from "@/lib/heic-conversion";

const { mockHeic2any } = vi.hoisted(() => ({
  mockHeic2any: vi.fn(),
}));

vi.mock("heic2any", () => ({
  default: mockHeic2any,
}));

describe("convertHeicFile", () => {
  beforeEach(() => {
    mockHeic2any.mockReset();
  });

  it("returns non-HEIC files unchanged", async () => {
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    const result = await convertHeicFile(file);

    expect(result).toBe(file);
    expect(mockHeic2any).not.toHaveBeenCalled();
  });

  it("converts a .HEIC file to .jpg using heic2any", async () => {
    const file = new File(["heic-bytes"], "IMG_0898.HEIC", { type: "" });
    const jpegBlob = new Blob(["jpeg-bytes"], { type: "image/jpeg" });
    mockHeic2any.mockResolvedValue(jpegBlob);

    const result = await convertHeicFile(file);

    expect(mockHeic2any).toHaveBeenCalledWith({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8,
    });
    expect(result.name).toBe("IMG_0898.jpg");
    expect(result.type).toBe("image/jpeg");
  });

  it("detects HEIC by MIME type even when the extension is unusual", async () => {
    const file = new File(["heic-bytes"], "photo.tmp", { type: "image/heic" });
    const jpegBlob = new Blob(["jpeg-bytes"], { type: "image/jpeg" });
    mockHeic2any.mockResolvedValue(jpegBlob);

    const result = await convertHeicFile(file);

    expect(result.name).toBe("photo.tmp.jpg");
    expect(result.type).toBe("image/jpeg");
  });

  it("uses the first blob when heic2any returns an array (burst photo)", async () => {
    const file = new File(["heic-bytes"], "burst.heif", { type: "" });
    const blob1 = new Blob(["frame-1"], { type: "image/jpeg" });
    const blob2 = new Blob(["frame-2"], { type: "image/jpeg" });
    mockHeic2any.mockResolvedValue([blob1, blob2]);

    const result = await convertHeicFile(file);

    expect(await result.text()).toBe("frame-1");
    expect(result.name).toBe("burst.jpg");
  });

  it("throws when heic2any fails to convert", async () => {
    const file = new File(["bad-bytes"], "corrupt.heic", { type: "" });
    mockHeic2any.mockRejectedValue(new Error("unsupported format"));

    await expect(convertHeicFile(file)).rejects.toThrow("unsupported format");
  });
});
