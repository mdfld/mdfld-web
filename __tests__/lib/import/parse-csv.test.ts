import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/import/parse-csv";

const HEADER = "title,description,price,compare_at_price,category,subcategory,brand,condition,images,tags,sku,inventory,has_variants,variant_size_value,variant_size_system,variant_price,variant_inventory,variant_sku,variant_color";

describe("parseCsv", () => {
  it("parses a simple product row", () => {
    const csv = [HEADER, 'Nike Boot,Great boot,199.99,,BOOTS,,Nike,BRAND_NEW,https://img.com/1.jpg,nike,SKU1,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Nike Boot");
    expect(rows[0].price).toBe(199.99);
    expect(rows[0].category).toBe("BOOTS");
    expect(rows[0].status).toBe("ready");
  });

  it("uses title as description fallback when description is blank", () => {
    const csv = [HEADER, 'Nike Boot,,199.99,,BOOTS,,Nike,BRAND_NEW,,,SKU2,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].description).toBe("Nike Boot");
  });

  it("flags unrecognised category as skip", () => {
    const csv = [HEADER, 'Weird Thing,Desc,10,,RANDOM,,Brand,BRAND_NEW,,,SKU3,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].status).toBe("skip");
    expect(rows[0].category).toBeNull();
  });

  it("flags unrecognised size as fix_size", () => {
    const csv = [HEADER, 'Boot,Desc,199,,BOOTS,,Nike,BRAND_NEW,,,SKU4,0,true,10.5 weird,,199,,SKU4v,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].status).toBe("fix_size");
    expect(rows[0].sizeSystem).toBeNull();
  });

  it("sanitises formula injection in title", () => {
    const csv = [HEADER, '=SUM(1),Desc,10,,BOOTS,,Nike,BRAND_NEW,,,SKU5,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].title).not.toMatch(/^=/);
  });

  it("skips comment rows starting with #", () => {
    const csv = ["# this is a comment", HEADER, 'Nike Boot,Desc,199.99,,BOOTS,,Nike,BRAND_NEW,,,SKU6,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
  });

  it("groups variant rows with same title into one product", () => {
    const csv = [
      HEADER,
      'Adidas Boot,Desc,229,,BOOTS,,Adidas,BRAND_NEW,,,, ,true,9,UK,229,2,SKU-UK9,',
      'Adidas Boot,,,,,,,,,,,, ,true,10,UK,229,3,SKU-UK10,',
    ].join("\n");
    const rows = parseCsv(csv);
    // Two variant rows grouped under one product = 2 ImportRows with same title
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Adidas Boot");
    expect(rows[1].title).toBe("Adidas Boot");
    expect(rows[0].hasVariants).toBe(true);
    expect(rows[0].sizeSystem).toBe("UK");
  });

  it("returns empty array for empty CSV", () => {
    expect(parseCsv("")).toHaveLength(0);
    expect(parseCsv(HEADER)).toHaveLength(0);
  });
});
