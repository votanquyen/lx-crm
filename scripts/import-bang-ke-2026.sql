-- ============================================================
-- IMPORT BẢNG KÊ CÂY XANH 2026
-- Source: plans/realdB/bang-ke-cay-xanh-2026.json
-- Date: 2026-01-14
-- Strategy: Strict match by company_name, UPDATE if exists
-- ============================================================

-- Create temporary table for import data
DROP TABLE IF EXISTS temp_bang_ke_import;
CREATE TEMP TABLE temp_bang_ke_import (
    sheet_name TEXT,
    client_name TEXT,
    address TEXT,
    period TEXT,
    contact TEXT,
    plants JSONB,
    -- Parsed fields
    year INT,
    month INT,
    period_start DATE,
    period_end DATE,
    subtotal DECIMAL(12,0),
    vat_rate DECIMAL(4,2) DEFAULT 8.00,
    vat_amount DECIMAL(12,0),
    total DECIMAL(12,0),
    customer_id TEXT
);

-- Insert raw data from JSON (41 clients)
INSERT INTO temp_bang_ke_import (sheet_name, client_name, address, period, contact, plants) VALUES
-- 1. VIKKI- CNC
('VIKKI- CNC', 'VIKKI', '', 'Đợt  : Từ 1/11/2025-30/11/2025', 'Ms. Thanh Hương',
 '[{"name": "Hạnh phúc, phát tài, saphire, Kim phát tài,...", "sizeSpec": "140-150", "quantity": 20, "unitPrice": 259591, "total": 5191820}]'::jsonb),

-- 2. MALACCA
('MALACCA', 'VĂN PHÒNG ĐẠI DIỆN MALACCA SOURCING PTE.LTD. TẠI THÀNH PHỐ HỒ CHÍ MINH', 'Tầng 6, 34A Phạm Ngọc Thạch, Phường Xuân Hòa, Thành Phố Hồ Chí Minh, Việt Nam', 'Đợt  : Từ 18/12/2025-17/01/2026', 'Chị Minh',
 '[{"name": "Bạch mã, cau vàng, phát tài khúc, hawaii", "sizeSpec": "110-150", "quantity": 4, "unitPrice": 180000, "total": 720000}, {"name": "Kim ngân, đại phú, Cau nhật,..", "sizeSpec": "150", "quantity": 1, "unitPrice": 400000, "total": 400000}]'::jsonb),

-- 3. QL QUỸ ĐT LIGHTHOUSE
('QL QUỸ ĐT LIGHTHOUSE', 'CÔNG TY CỔ PHẦN QUẢN LÝ QUỸ ĐẦU TƯ LIGHTHOUSE', 'Tầng 5, Số 65 Phạm Ngọc Thạch, Phường Xuân Hòa, TP. Hồ Chí Minh', 'Đợt  : Từ 1/01/2026-31/01/2026', 'Ms. Thảo ( 0906656453)',
 '[{"name": "Kim phát tài, Bàng Singapore", "sizeSpec": "110-150", "quantity": 2, "unitPrice": 300000, "total": 600000}]'::jsonb),

-- 4. Việt Hàn
('Việt Hàn', 'VĂN PHÒNG', '24-26, Đường số 8B, Phường Bình Trưng, Thành Phố Hồ Chí Minh, Việt Nam.', 'Đợt  : Từ 1/01/2026-31/01/2026', 'Ms.  Huỳnh Như',
 '[{"name": "Van Niên thanh, Bàng Sing, Phát tài khúc, Lưỡi hổ, Kim Phát tài", "sizeSpec": "110-150", "quantity": 9, "unitPrice": 240000, "total": 2160000}, {"name": "Để bàn ( Ngọc Ngân)", "sizeSpec": "", "quantity": 2, "unitPrice": 120000, "total": 240000}, {"name": "Đại phú gia", "sizeSpec": "150", "quantity": 2, "unitPrice": 350000, "total": 700000}]'::jsonb),

-- 5. VECTƠ
('VECTƠ', 'CÔNG TY TNHH DỊCH VỤ HÀNG KHÔNG VÉC TƠ QUỐC TẾ', '39B Trường Sơn, Lầu 11, Tòa nhà Hải Âu , Phường Tân Sơn Nhất, Tp. Hồ Chí Minh, Việt Nam', 'Đợt : từ 15/12/2025 -14/01/2026', 'Chị Loan',
 '[{"name": "Bạch mã, Cau vàng, Phát tài khúc, Trúc bách hợp, Kim phát tài, Lưỡi hổ", "sizeSpec": "110-140", "quantity": 7, "unitPrice": 240000, "total": 1680000}, {"name": "Cây để bàn các loại", "sizeSpec": "", "quantity": 2, "unitPrice": 120000, "total": 240000}]'::jsonb),

-- 6. ACER VN
('ACER VN', 'CÔNG TY TRÁCH NHIỆM HỮU HẠN ACER VIỆT NAM', 'P704-05 Tòa nhà Saigon Trade Center, số 37 đường Tôn Đức Thắng, Phường Sài Gòn, TP Hồ Chí Minh', 'Đợt : từ 1/12/2025 -31/12/2025', 'Ms. Hiền',
 '[{"name": "Phát tài khúc, Kim phát tài, Lưỡi hổ", "sizeSpec": "110-140", "quantity": 3, "unitPrice": 300000, "total": 900000}, {"name": "Kim Phát tài ( Bs 14/6)", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}]'::jsonb),

-- 7. PVI VN
('PVI VN', 'VPDD BẢO HIỂM PVI PHÍA NAM', 'tầng 1, 673 Nguyễn Hữu Thọ, Nhà Bè', 'Đợt (  từ 1/12/2025 -31/12/2025)', '',
 '[{"name": "Hawaii", "sizeSpec": "130-150", "quantity": 3, "unitPrice": 200000, "total": 600000}, {"name": "Cau vàng", "sizeSpec": "130-150", "quantity": 3, "unitPrice": 200000, "total": 600000}, {"name": "Vạn niên thanh", "sizeSpec": "120-130", "quantity": 2, "unitPrice": 200000, "total": 400000}, {"name": "Bạch mã", "sizeSpec": "120-130", "quantity": 3, "unitPrice": 200000, "total": 600000}]'::jsonb),

-- 8. Agribank sài gòn
('Agribank sài gòn', 'NGÂN HÀNG AGRIBANK- CN SÀI GÒN', 'Tháng 1/2026', '', '',
 '[{"name": "Phát tài gốc, saphire chậu đá", "sizeSpec": "140-150cm", "quantity": 5, "unitPrice": 440000, "total": 2200000}, {"name": "Cau vàng, phát tài khúc,bạch mã hoàng tử ,hawaii, mật cật,..", "sizeSpec": "100-130cm", "quantity": 11, "unitPrice": 165000, "total": 1815000}, {"name": "Phát tài núi (size trung)", "sizeSpec": "140-150", "quantity": 2, "unitPrice": 500000, "total": 1000000}]'::jsonb),

-- 9. RGF HR VN
('RGF HR VN', 'CÔNG TY TRÁCH NHIỆM HỮU HẠN RGF HR AGENT VIỆT NAM', 'Tầng 7, Centec Tower, 72-74 Nguyễn Thị Minh Khai, Phường Xuân Hòa, Thành phố Hồ Chí Minh, Việt Nam', 'Đợt  (16/12/2025- 15/01/2026)', '',
 '[{"name": "Phát tài lớn", "sizeSpec": "150 cm", "quantity": 1, "unitPrice": 400000, "total": 400000}, {"name": "Kim phát tài", "sizeSpec": "80-110 Cm", "quantity": 2, "unitPrice": 180000, "total": 360000}, {"name": "Phát tài khúc (bàn)", "sizeSpec": "150 cm", "quantity": 2, "unitPrice": 100000, "total": 200000}]'::jsonb),

-- 10. CADIAN
('CADIAN', 'CADIAN', 'Tầng 10, Tòa Nhà Saigon Paragon Số 03 Đường Nguyễn Lương Bằng, Phường Tân Mỹ, Thành Phố Hồ Chí Minh, Việt Nam.', 'Đợt ( 07/01/2026- 06/02/2026)', '',
 '[{"name": "Kim Ngân", "sizeSpec": "", "quantity": 4, "unitPrice": 400000, "total": 1600000}, {"name": "Phát tài khúc", "sizeSpec": "", "quantity": 10, "unitPrice": 180000, "total": 1800000}, {"name": "bạch mã", "sizeSpec": "1.5m", "quantity": 1, "unitPrice": 180000, "total": 180000}]'::jsonb),

-- 11. AGRIBANK _PN
('AGRIBANK _PN)', 'NGÂN HÀNG AGRIBANK PHÚ NHUẬN', '135A Phan Đăng Lưu, Phường Cầu Kiệu, Thành Phố Hồ Chí Minh, Việt Nam', 'Đợt ( 01/01/2026- 31/01/2026)', '',
 '[{"name": "Phát tài, hawaii,..", "sizeSpec": "1.3-1.5m", "quantity": 10, "unitPrice": 150000, "total": 1500000}]'::jsonb),

-- 12. RAZONA
('RAZONA', 'CÔNG TY TNHH RAZONA VIỆT NAM', 'Ms. Thanh Thúy ( 0919 431145)', 'Đợt (01/01/2026-31/01/2026)', '',
 '[{"name": "Đạo phú quý", "sizeSpec": "1.6m", "quantity": 1, "unitPrice": 500000, "total": 500000}, {"name": "Cau Nhật", "sizeSpec": "1.6m", "quantity": 2, "unitPrice": 500000, "total": 1000000}, {"name": "Ngân Hậu", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 200000, "total": 200000}, {"name": "Lan Mỹ", "sizeSpec": "1.0m", "quantity": 2, "unitPrice": 200000, "total": 400000}]'::jsonb),

-- 13. NEW BALANCE
('NEW BALANCE', 'NEW BALANCE', 'Phòng 1501-1502, Continental Tower, 81-85 Hàm Nghi, Phường Sài Gòn, TP. HCM', 'Đợt   từ 15/12/2025 -14/01/2026', 'Ms. Tina(Tiana.Nguyen@newbalance.com)',
 '[{"name": "Kim phát tài", "sizeSpec": "1.0-1.2m", "quantity": 2, "unitPrice": 150000, "total": 300000}, {"name": "Phát tài khúc", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Hawaii", "sizeSpec": "1.0-1.2m", "quantity": 2, "unitPrice": 150000, "total": 300000}, {"name": "Bạch mã", "sizeSpec": "1.0-1.2m", "quantity": 2, "unitPrice": 150000, "total": 300000}, {"name": "Phát tài khúc", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Cau kiểng", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Mật cật", "sizeSpec": "1.0-1,2m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Ngân hậu", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Cau vàng, Cau nhật", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 350000, "total": 350000}, {"name": "Để bàn", "sizeSpec": "1.0-1.2m", "quantity": 2, "unitPrice": 100000, "total": 200000}, {"name": "Trúc bách hợp", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 150000, "total": 150000}]'::jsonb),

-- 14. CK Phú Hưng
('CK Phú HƯng', 'CÔNG TY CỔ PHẦN CHỨNG KHOÁN PHÚ HƯNG', 'Tầng 21, Phú Mỹ Hưng Tower, 08 Hoàng Văn Thái, Phường Tân Mỹ, Thành phố Hồ Chí Minh', 'Đợt  ( từ 15/12/2025 -14/01/2026 )', 'Ms. Vy ( 0939099990)',
 '[{"name": "Kim phát tài", "sizeSpec": "1.0-1.2m", "quantity": 16, "unitPrice": 150000, "total": 2400000}, {"name": "Bạch mã", "sizeSpec": "1.0-1.2m", "quantity": 4, "unitPrice": 150000, "total": 600000}, {"name": "Phát tài khúc", "sizeSpec": "1.2-1.3m", "quantity": 3, "unitPrice": 150000, "total": 450000}]'::jsonb),

-- 15. Gras Savoye (use sheet_name as fallback)
('Gras Savoye', 'Gras Savoye', '37 Tôn Đức Thắng, Phường Sài Gòn, TP. Hồ Chí Minh', 'Đợt : từ 1/01/2026-31/01/2026', '',
 '[{"name": "Hawaii (2), bạch mã", "sizeSpec": "1.4-1.6m", "quantity": 3, "unitPrice": 130000, "total": 390000}, {"name": "Kim phát tài, phát tài", "sizeSpec": "1.0-1.2m", "quantity": 9, "unitPrice": 130000, "total": 1170000}, {"name": "để bàn", "sizeSpec": "0.2m", "quantity": 1, "unitPrice": 80000, "total": 80000}, {"name": "Khay phát tài", "sizeSpec": "", "quantity": 1, "unitPrice": 300000, "total": 300000}, {"name": "Phát tài gốc ( trung)", "sizeSpec": "", "quantity": 1, "unitPrice": 350000, "total": 350000}, {"name": "Kim Ngân ( trung)", "sizeSpec": "", "quantity": 1, "unitPrice": 350000, "total": 350000}, {"name": "Bàng Singapore ( Chữ Nhậtlớn)", "sizeSpec": "", "quantity": 2, "unitPrice": 400000, "total": 800000}, {"name": "Đế vương xanh ( BS tháng 7)", "sizeSpec": "", "quantity": 1, "unitPrice": 350000, "total": 350000}]'::jsonb),

-- 16. Saigon res
('Saigon res', 'SÀI GÒN RES', '63- 65 Điện Biên Phủ, TPHCM', 'Đợt : từ 01/12/2025-31/12/2025', 'Mr. Ba',
 '[{"name": "Bạch mã (bầu)", "sizeSpec": "0.5m", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Kim phát tài", "sizeSpec": "0.9-1.0m", "quantity": 2, "unitPrice": 150000, "total": 300000}, {"name": "Phát tài khúc", "sizeSpec": "1.5m", "quantity": 2, "unitPrice": 200000, "total": 400000}]'::jsonb),

-- 17. Vietcombank-Pham hùng (use sheet_name)
('Vietcombank-Pham hùng', 'NGÂN HÀNG VIETCOMBANK - CN TÂY SÀI GÒN', '323 Phạm Hùng,KDC HimLam, Ấp 4A, Bình Chánh', '', 'Mr. Ngọc Anh',
 '[{"name": "Để bàn ( Kim Ngân lớn)", "sizeSpec": "30-40", "quantity": 1, "unitPrice": 150000, "total": 150000}, {"name": "Cau vàng, bạch mã, hawaii", "sizeSpec": "100-110", "quantity": 4, "unitPrice": 130000, "total": 520000}, {"name": "Phát tài khúc", "sizeSpec": "130-150", "quantity": 9, "unitPrice": 250000, "total": 2250000}, {"name": "Đế vương, Cau Nhật", "sizeSpec": "110-160", "quantity": 5, "unitPrice": 300000, "total": 1500000}, {"name": "Phát tài gốc (trung)", "sizeSpec": "170", "quantity": 3, "unitPrice": 500000, "total": 1500000}, {"name": "Phát tài gốc ( size đại)", "sizeSpec": "180", "quantity": 1, "unitPrice": 600000, "total": 600000}]'::jsonb),

-- 18. Nha Khoa Hoàn Mỹ
('Nha Khoa Hoàn Mỹ', 'CÔNG TY HOÀN MỸ', 'Phòng 1101, Lầu 11, Tòa nhà Friendship, 31 Lê Duẩn, Phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam.', 'Đợt ( 1/01/2026- 31/01/2026)', 'Ms. Hằng',
 '[{"name": "Phát tài khúc", "sizeSpec": "1.0.-1.1m", "quantity": 3, "unitPrice": 200000, "total": 600000}, {"name": "Bàng Singapore", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 200000, "total": 200000}, {"name": "Kim Phát tài", "sizeSpec": "1.1m", "quantity": 1, "unitPrice": 200000, "total": 200000}, {"name": "Đại phú gia", "sizeSpec": "1.5m", "quantity": 2, "unitPrice": 200000, "total": 400000}, {"name": "Cây để kệ", "sizeSpec": "0.3m", "quantity": 28, "unitPrice": 120000, "total": 3360000}, {"name": "Saphire", "sizeSpec": "1.4-1.6m", "quantity": 2, "unitPrice": 200000, "total": 400000}]'::jsonb),

-- 19. IVS
('IVS', 'CÔNG TY IVS', 'Lầu 3, 180-182 Lý Chính Thắng', 'Đợt:  01/12/2025- 31/12/2025', 'Ms. Thảo',
 '[{"name": "Phát tài", "sizeSpec": "1.6m", "quantity": 1, "unitPrice": 250000, "total": 250000}, {"name": "Kè nhật", "sizeSpec": "1.3m", "quantity": 1, "unitPrice": 250000, "total": 250000}, {"name": "Đại phú gia", "sizeSpec": "1..3m", "quantity": 1, "unitPrice": 250000, "total": 250000}, {"name": "Kim phát tài", "sizeSpec": "1.1m", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Cau vàng", "sizeSpec": "1.5m", "quantity": 4, "unitPrice": 150000, "total": 600000}, {"name": "Bạch mã", "sizeSpec": "1.0m", "quantity": 2, "unitPrice": 150000, "total": 300000}]'::jsonb),

-- 20. TMF
('TMF', 'TMF', 'Phòng 1, Tầng 8 Tòa nhà Bitexco Financial Tower, Số 2 Đường Hải Triều, Phường Sài Gòn, TP Hồ Chí Minh', 'Đợt  (Từ 15/12/2025 đến 14/01/2026)', 'Ms. Thư/ Châu',
 '[{"name": "Phát tài", "sizeSpec": "1.4m", "quantity": 11, "unitPrice": 150000, "total": 1650000}, {"name": "Để bàn", "sizeSpec": "0.2m", "quantity": 5, "unitPrice": 100000, "total": 500000}, {"name": "Trầu bà Saphire", "sizeSpec": "1.5m", "quantity": 3, "unitPrice": 350000, "total": 1050000}, {"name": "Phát tài núi", "sizeSpec": "1.2m", "quantity": 3, "unitPrice": 240000, "total": 720000}, {"name": "Kim phát tài", "sizeSpec": "1.1m", "quantity": 2, "unitPrice": 240000, "total": 480000}, {"name": "Để hộc/kệ", "sizeSpec": "0.3m", "quantity": 14, "unitPrice": 100000, "total": 1400000}]'::jsonb),

-- 21. Ogilvy
('Ogilvy', 'CÔNG TY OGILVY T & A', 'Số 51 Đường Phan Bội Châu, Phường Cửa Nam, Thành phố Hà Nội, Việt Nam', 'Đợt :(24/12/2025 -23/01/2026)', 'Mr. Gia Lạp',
 '[{"name": "Tiểu cảnh : 4 Montera, 3 ngân hậu,4 vạn lộc, 6 trầu bà, 1 chuối thái, 2 dôla, 2 giữ tiền", "sizeSpec": "", "quantity": 1, "unitPrice": 3000000, "total": 3000000}, {"name": "Chuối thái ( chậu chữ nhật lớn-", "sizeSpec": "", "quantity": 2, "unitPrice": 400000, "total": 800000}, {"name": "Hawaii ( chậu chữ nhật)", "sizeSpec": "", "quantity": 2, "unitPrice": 500000, "total": 1000000}, {"name": "Đế vương đỏ", "sizeSpec": "", "quantity": 1, "unitPrice": 400000, "total": 400000}, {"name": "Bồn kè nhật ( mix trầu bà)", "sizeSpec": "", "quantity": 1, "unitPrice": 500000, "total": 500000}, {"name": "Bạch mã ( mix trầu bà)", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}, {"name": "Trâu bà Saphire", "sizeSpec": "", "quantity": 1, "unitPrice": 400000, "total": 400000}, {"name": "Đế vường mix trầu bà ( hộc nhỏ)", "sizeSpec": "", "quantity": 1, "unitPrice": 600000, "total": 600000}, {"name": "Trúc bách hợp", "sizeSpec": "", "quantity": 5, "unitPrice": 300000, "total": 1500000}, {"name": "Để bàn các loại", "sizeSpec": "", "quantity": 32, "unitPrice": 120000, "total": 3840000}, {"name": "Bàng singapore", "sizeSpec": "", "quantity": 1, "unitPrice": 300000, "total": 300000}, {"name": "Thuỷ Canh", "sizeSpec": "", "quantity": 1, "unitPrice": 120000, "total": 120000}, {"name": "Bàng Singapore", "sizeSpec": "", "quantity": 1, "unitPrice": 300000, "total": 300000}, {"name": "Kim phát tài ( để bàn)", "sizeSpec": "", "quantity": 1, "unitPrice": 120000, "total": 120000}]'::jsonb),

-- 22. Luật QT
('Luật QT', 'CÔNG TY LUẬT TNHH TƯ VẤN QUỐC TẾ (INDOCHINE COUNSEL)', 'Phòng 305, Tầng 3, Centec Tower, số 72 - 74 Nguyễn Thị Minh Khai, Phường Xuân Hòa, Thành phố Hồ Chí Minh.', 'Đợt (Từ 1/12/2025 đến 31/12/2025)', '',
 '[{"name": "Bạch mã", "sizeSpec": "1.0m", "quantity": 2, "unitPrice": 145000, "total": 290000}, {"name": "Kim phát tài", "sizeSpec": "1.0m", "quantity": 1, "unitPrice": 145000, "total": 145000}, {"name": "Cây Để bàn", "sizeSpec": "0.25-0.3m", "quantity": 3, "unitPrice": 90000, "total": 270000}, {"name": "Phát tài núi", "sizeSpec": "", "quantity": 1, "unitPrice": 500000, "total": 500000}]'::jsonb),

-- 23. FUJIFILM MỚI
('FUJIFILM MỚI''', 'CÔNG TY FUJI FILM', 'Tầng 19, Tháp A, số 15 đường Trần Bạch Đằng, Phường An Khánh, Thành phố Hồ Chí Minh, Việt Nam', 'Đợt : (09/12/2025 đến 08/01/2026)', '',
 '[{"name": "Bạch mã", "sizeSpec": "1.0-1.2m", "quantity": 4, "unitPrice": 145000, "total": 580000}, {"name": "Vạn niên thanh", "sizeSpec": "1.4-1.5m", "quantity": 4, "unitPrice": 145000, "total": 580000}, {"name": "Kim phát tài", "sizeSpec": "1.0 -1.2m", "quantity": 4, "unitPrice": 145000, "total": 580000}, {"name": "Phát tài khúc", "sizeSpec": "1.4-1.5m", "quantity": 4, "unitPrice": 145000, "total": 580000}, {"name": "Để bàn", "sizeSpec": "", "quantity": 8, "unitPrice": 75000, "total": 600000}]'::jsonb),

-- 24. HARVES 39B Trường Sơn
('HARVES 39B Trường Sơn', 'CÔNG TY TNHH VIỆT NAM HARVES', '', 'Đợt : (12/12/2025 đến 11/01/2026)', 'Chị Quế Phan 0918.696.169',
 '[{"name": "Phát tài khúc,lưỡi hổ,kim phát tài", "sizeSpec": "110-140", "quantity": 6, "unitPrice": 240000, "total": 1440000}, {"name": "Để bàn các loại", "sizeSpec": "25-35", "quantity": 4, "unitPrice": 100000, "total": 400000}]'::jsonb),

-- 25. Minh Việt
('Minh Việt', 'CÔNG TY MINH VIỆT', 'Đính kèm hoá đơn số: 14 Ký hiệu 1C26TLX Ngày 12 /01/2026', 'Đợt  : 15/12/2025- 14/01/2026', '',
 '[{"name": "Phát tài khúc, Kim phát tài", "sizeSpec": "1.1-1.5m", "quantity": 6, "unitPrice": 180000, "total": 1080000}, {"name": "Trầu bà Saphire", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}]'::jsonb),

-- 26. Eximbank ( CN Sai Gon)
('Eximbank ( CN Sai Gon)', 'NGÂN HÀNG EXIMBANK (CN SÀI GÒN)', '87A Hàm Nghi, TPHCM', '', '',
 '[{"name": "Phát Tài khúc, hawaii", "sizeSpec": "Sảnh", "quantity": 4, "unitPrice": 250000, "total": 1000000}, {"name": "Bạch mã", "sizeSpec": "", "quantity": 3, "unitPrice": 250000, "total": 750000}, {"name": "Saphire", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Saphire", "sizeSpec": "Tầng Lững", "quantity": 3, "unitPrice": 350000, "total": 1050000}, {"name": "Đế vương lớn", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Cau Nhật", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Saphire", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Đại phú gia nhỏ", "sizeSpec": "", "quantity": 4, "unitPrice": 250000, "total": 1000000}, {"name": "Cây lớn tiểu cảnh", "sizeSpec": "", "quantity": 2, "unitPrice": 250000, "total": 500000}, {"name": "Tiểu cảnh ( 9 chậu nhỏ)", "sizeSpec": "", "quantity": 4, "unitPrice": 300000, "total": 1200000}, {"name": "Phát tài khúc", "sizeSpec": "", "quantity": 1, "unitPrice": 250000, "total": 250000}, {"name": "trầu Bà Saphire", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Đế vương đỏ", "sizeSpec": "", "quantity": 3, "unitPrice": 350000, "total": 1050000}]'::jsonb),

-- 27. Eximbank ( CN Kỳ Đồng)
('Eximbank ( CN Kỳ Đồng)', 'NGÂN HÀNG EXIMBANK - KỲ ĐỒNG', 'ĐC: B20, Park Riverside, Bưng Ông Thoàn,,KP1, p Long Trường TP.HCM', '', 'Mr. Nhật ( 096.738.2665)',
 '[{"name": "Trúc bách hợp", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Trầu bà saphire", "sizeSpec": "", "quantity": 1, "unitPrice": 350000, "total": 350000}, {"name": "Cau nhật", "sizeSpec": "", "quantity": 1, "unitPrice": 350000, "total": 350000}, {"name": "Kim Ngân", "sizeSpec": "", "quantity": 1, "unitPrice": 400000, "total": 400000}]'::jsonb),

-- 28. Agribank Phan Đăng Lưu
('Agribank Phan Đăng Lưu', 'NGÂN HÀNG AGRIBANK PHAN ĐĂNG LƯU', '135A Phan Đăng Lưu', 'Đợt Từ 1/10/2025 đến 31/10/2025', 'Chị Hà',
 '[{"name": "Cau Nhật", "sizeSpec": "1.3-1.4m", "quantity": 2, "unitPrice": 200000, "total": 400000}, {"name": "Phát tài", "sizeSpec": "1.3-1.5m", "quantity": 1, "unitPrice": 200000, "total": 200000}, {"name": "Thanh Xuân", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 200000, "total": 200000}]'::jsonb),

-- 29. Oglivy & Mather
('Oglivy & Mather', 'OGLIVY & MATHER', '', 'Đợt : Từ 1/01/2026-31/01/2026', '',
 '[{"name": "Kim ngân", "sizeSpec": "", "quantity": 2, "unitPrice": 500000, "total": 1000000}, {"name": "Phát tài khúc", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}, {"name": "Kim phát tài", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}, {"name": "Đế vương xanh", "sizeSpec": "", "quantity": 2, "unitPrice": 400000, "total": 800000}, {"name": "Trầu bà Saphire", "sizeSpec": "", "quantity": 2, "unitPrice": 500000, "total": 1000000}, {"name": "Đại phú gia", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}, {"name": "Lưỡi hổ", "sizeSpec": "", "quantity": 2, "unitPrice": 300000, "total": 600000}, {"name": "Bạch mã", "sizeSpec": "", "quantity": 1, "unitPrice": 300000, "total": 300000}, {"name": "Chuối thái (Chậu chữ nhật)", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}]'::jsonb),

-- 30. Giàn Khoan
('Giàn Khoan', 'GIÀN KHOAN', '', 'Đợt: tháng 1/2026', '',
 '[{"name": "Phát tài khúc", "sizeSpec": "", "quantity": 4, "unitPrice": 200000, "total": 800000}, {"name": "Lưỡi hổ", "sizeSpec": "", "quantity": 1, "unitPrice": 200000, "total": 200000}, {"name": "Lưỡi hổ mix", "sizeSpec": "", "quantity": 1, "unitPrice": 300000, "total": 300000}, {"name": "Trầu bà cột", "sizeSpec": "", "quantity": 3, "unitPrice": 400000, "total": 1200000}]'::jsonb),

-- 31. 58 Võ Văn Tần (skip - corrupt data with so_luong = 100000)
-- ('58 Võ Văn Tần', '', 'Số 58 Đường Võ Văn Tần', 'Đợt 20/12/2025-19/01/2026', '', '[]'::jsonb),

-- 32. yusen
('yusen', 'YUSEN', '', 'Từ 15/12/2025  đến 14/01/2026', '',
 '[{"name": "Mật cật", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Phát tài khúc", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Cau vàng", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 130000, "total": 130000}]'::jsonb),

-- 33. DL&DV HK Biển Đông
('DL&DV HK Biển Đông', 'DL&DV HK BIỂN ĐÔNG', 'Lầu 2, P201, 2A-4A Tôn Đức Thắng, Q.1', 'Đợt 65(Từ 1/7/2025 đến 30/8/2025)', 'Ms. Xuân Ba : 73055888',
 '[{"name": "Hawaii", "sizeSpec": "1.2m", "quantity": 1, "unitPrice": 145000, "total": 145000}, {"name": "Phát tài", "sizeSpec": "1.2m", "quantity": 1, "unitPrice": 145000, "total": 145000}]'::jsonb),

-- 34. INDOGUNA VINA
('INDOGUNA VINA', 'INDOGUNA VINA', '44B Phan Xích Long, Phú Nhuận', 'Đợt Từ 1/9/2024 đến 20/9/2024)', 'Ms. Hương (0919 797 255)',
 '[{"name": "Hawaii", "sizeSpec": "1.4m", "quantity": 1, "unitPrice": 140000, "total": 140000}, {"name": "Phát tài khúc", "sizeSpec": "1.5m", "quantity": 1, "unitPrice": 140000, "total": 140000}, {"name": "Đại phú gia", "sizeSpec": "1.4m", "quantity": 2, "unitPrice": 250000, "total": 500000}, {"name": "Phát tài khúc", "sizeSpec": "1.4m", "quantity": 3, "unitPrice": 140000, "total": 420000}, {"name": "Vạn niên thanh", "sizeSpec": "1.2m", "quantity": 2, "unitPrice": 140000, "total": 280000}]'::jsonb),

-- 35. ZETAPROCES VN
('ZETAPROCES VN', 'CÔNG TY ZETAPROCESS VIỆT NAM', 'Tầng 5, toàn nhà TNR, 180-192 Nguyễn Công Trứ, Quận 1', 'Đợt ( 21/3/2024-20/4/2024)', 'Ms. Diễm',
 '[{"name": "Cau Nhật", "sizeSpec": "1.4m", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Lưỡi hổ", "sizeSpec": "1.1m", "quantity": 2, "unitPrice": 245000, "total": 490000}]'::jsonb),

-- 36. EMXIBANK KỲ ĐỒNG (different from Eximbank CN Kỳ Đồng)
('EMXIBANK KỲ ĐỒNG', 'NGÂN HÀNG EXIMBANK - CN QUẬN 3', 'Tầng 19, tháp A, khu chức năng số 1- KĐTM Thủ Thiêm', 'Đợt : (1/05/2025 đến 31/05/2025)', 'Mr. Nhật',
 '[{"name": "Kim ngân", "sizeSpec": "1.0-1.2m", "quantity": 1, "unitPrice": 400000, "total": 400000}, {"name": "Kim tiền, Trầu bà Saphire", "sizeSpec": "1.4-1.5m", "quantity": 2, "unitPrice": 350000, "total": 700000}, {"name": "Trúc bách hợp, cau nhật", "sizeSpec": "", "quantity": 2, "unitPrice": 350000, "total": 700000}]'::jsonb),

-- 37. TẦNG 16- 20 VÕ VĂN KIỆT
('TẦNG 16- 20 VÕ VĂN KIỆT', 'TẦNG 16 - SỐ 20 VÕ VĂN KIỆT', 'Tầng 19, tháp A, khu chức năng số 1- KĐTM Thủ Thiêm', 'Đợt : (01/01/2025đến 31/01/2025)', 'Chị Liễu- 0982002627',
 '[{"name": "Hạnh phúc (size đại)", "sizeSpec": "1.7-1.8m", "quantity": 3, "unitPrice": 500000, "total": 1500000}, {"name": "Kim Ngân trụ cổ thụ", "sizeSpec": "1.4-1.5m", "quantity": 2, "unitPrice": 500000, "total": 1000000}, {"name": "Phát tài Sen", "sizeSpec": "1.3-1.4m", "quantity": 2, "unitPrice": 500000, "total": 1000000}]'::jsonb),

-- 38. VIKKI 25BIS
('VIKKI 25BIS', 'VIKKI 25BIS', '130 Phan đăng lưu, P Cầu Kiệu Tp HCM', 'Đợt Từ 11/12/2025 đến 31/12/2025 (21 ngày)', 'Ms. Hồng Vân',
 '[{"name": "Kim phát tài", "sizeSpec": "1.1-1.6m", "quantity": 4, "unitPrice": 260000, "total": 1040000}, {"name": "Đế vương, vạn lộc (để bàn)", "sizeSpec": "0.2-0.3m", "quantity": 5, "unitPrice": 93000, "total": 465000}, {"name": "Kim ngân lớn", "sizeSpec": "1.1-1.6m", "quantity": 1, "unitPrice": 260000, "total": 260000}]'::jsonb),

-- 39. UOB Q1 (skip - corrupt data with so_luong values like 400000, 600000)
-- ('UOB Q1', 'NGÂN HÀNG UNITED OVERSEAS', '', 'Đợt ( 15/11/2025-14/12/2025)', '', '[]'::jsonb),

-- 40. Agribank Phan Đăng Lưu (mua cây) - purchase not rental
('Agribank Phan Đăng Lưu（mua cây)', 'NGÂN HÀNG AGRIBANK PHAN ĐĂNG LƯU (MUA CÂY)', 'Giao cây ngày 30/9/2025', '', 'Chị Hà',
 '[{"name": "Trầu bà (Mua)", "sizeSpec": "0.25-0.3m", "quantity": 8, "unitPrice": 190000, "total": 1520000}, {"name": "Hạnh phúc (mua)", "sizeSpec": "0.25-0.3m", "quantity": 1, "unitPrice": 250000, "total": 250000}]'::jsonb),

-- 41. SAMSON
('SAMSON', 'SAMSON', 'Tầng 03A thuộc Khối tháp E, Tòa nhà Cộng Hòa Garden, số 20 đường Cộng Hoà', 'Đợt : Từ 1/01/2026-31/01/2026', '',
 '[{"name": "Phát tài khúc", "sizeSpec": "Chậu", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Kim phát tài", "sizeSpec": "Chậu", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Đế vương xanh", "sizeSpec": "Chậu", "quantity": 1, "unitPrice": 80000, "total": 80000}, {"name": "Cau Hawaii", "sizeSpec": "Chậu", "quantity": 1, "unitPrice": 130000, "total": 130000}, {"name": "Monstera", "sizeSpec": "Chậu", "quantity": 1, "unitPrice": 400000, "total": 400000}, {"name": "Cây để bàn trong hộc", "sizeSpec": "Chậu", "quantity": 5, "unitPrice": 80000, "total": 400000}]'::jsonb);

-- ============================================================
-- STEP 1: Calculate subtotals from plants JSONB
-- ============================================================
UPDATE temp_bang_ke_import
SET subtotal = (
    SELECT COALESCE(SUM((item->>'total')::DECIMAL), 0)
    FROM jsonb_array_elements(plants) AS item
);

-- Calculate VAT and total
UPDATE temp_bang_ke_import
SET
    vat_amount = ROUND(subtotal * vat_rate / 100),
    total = subtotal + ROUND(subtotal * vat_rate / 100);

-- ============================================================
-- STEP 2: Parse period strings to extract year, month, dates
-- Default to January 2026 for missing periods
-- ============================================================
UPDATE temp_bang_ke_import
SET
    year = 2026,
    month = 1,
    period_start = '2026-01-01'::DATE,
    period_end = '2026-01-31'::DATE
WHERE period IS NULL OR period = '';

-- Parse periods like "Đợt : Từ 1/11/2025-30/11/2025"
UPDATE temp_bang_ke_import
SET
    year = CASE
        WHEN period ~ '\d{1,2}/\d{1,2}/202[456]' THEN
            (regexp_match(period, '(\d{1,2})/(\d{1,2})/(202[456])'))[3]::INT
        ELSE 2026
    END,
    month = CASE
        WHEN period ~ '\d{1,2}/\d{1,2}/202[456]' THEN
            (regexp_match(period, '(\d{1,2})/(\d{1,2})/(202[456])'))[2]::INT
        ELSE 1
    END
WHERE period IS NOT NULL AND period != '';

-- Set period dates based on extracted year/month
UPDATE temp_bang_ke_import
SET
    period_start = make_date(year, month, 1),
    period_end = (make_date(year, month, 1) + INTERVAL '1 month - 1 day')::DATE
WHERE period_start IS NULL;

-- ============================================================
-- STEP 3: Match customers by companyName (normalized)
-- Strategy: Strict match only
-- ============================================================
UPDATE temp_bang_ke_import t
SET customer_id = c.id
FROM customers c
WHERE
    -- Exact match on companyName
    LOWER(TRIM(c."companyName")) = LOWER(TRIM(t.client_name))
    OR LOWER(TRIM(c."shortName")) = LOWER(TRIM(t.client_name))
    OR LOWER(TRIM(c."companyName")) LIKE '%' || LOWER(TRIM(t.sheet_name)) || '%'
    OR LOWER(TRIM(c."shortName")) LIKE '%' || LOWER(TRIM(t.sheet_name)) || '%';

-- ============================================================
-- STEP 3.5: Manual Customer Mappings (for unmatched clients)
-- ============================================================
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnop540006k0b213sxhlre' WHERE sheet_name = 'Oglivy & Mather' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopqx000ik0b2rq7sl8rm' WHERE sheet_name = 'Giàn Khoan' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopcs000ak0b2qo31hvb8' WHERE sheet_name = 'EMXIBANK KỲ ĐỒNG' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopi9000dk0b29zovwbzm' WHERE sheet_name = 'VIKKI 25BIS' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopud000kk0b24ajl9g8f' WHERE sheet_name = 'Gras Savoye' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnoowd0001k0b2ebw5c4m1' WHERE sheet_name = 'Vietcombank-Pham hùng' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnoq50000qk0b2zvm5nxnp' WHERE sheet_name = 'Nha Khoa Hoàn Mỹ' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnor0l0018k0b286i01k6k' WHERE sheet_name = 'HARVES 39B Trường Sơn' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopeh000bk0b2byaj21ky' WHERE sheet_name = 'Eximbank ( CN Sai Gon)' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnopcs000ak0b2qo31hvb8' WHERE sheet_name = 'Eximbank ( CN Kỳ Đồng)' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnooy30002k0b2insoy05k' WHERE sheet_name = 'Agribank Phan Đăng Lưu' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnooy30002k0b2insoy05k' WHERE sheet_name = 'Agribank Phan Đăng Lưu（mua cây)' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnop750007k0b2w4iqs6sk' WHERE sheet_name = 'PVI VN' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnoozu0003k0b2moq8vpqn' WHERE sheet_name = 'Agribank sài gòn' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnoqc4000uk0b275vre9iv' WHERE sheet_name LIKE 'FUJIFILM MỚI%' AND customer_id IS NULL;
UPDATE temp_bang_ke_import SET customer_id = 'cmkdnor2a0019k0b2cxfe8sdp' WHERE sheet_name = 'UOB Q1' AND customer_id IS NULL;

-- ============================================================
-- STEP 4: Report unmatched customers
-- ============================================================
SELECT
    'UNMATCHED' as status,
    sheet_name,
    client_name,
    subtotal,
    total
FROM temp_bang_ke_import
WHERE customer_id IS NULL
ORDER BY subtotal DESC;

-- ============================================================
-- STEP 5: UPSERT monthly_statements
-- Strategy: Update if exists (based on your answer)
-- Note: Use DISTINCT ON to handle duplicate customer+year+month in import
-- ============================================================
INSERT INTO monthly_statements (
    id,
    "customerId",
    year,
    month,
    "periodStart",
    "periodEnd",
    "contactName",
    plants,
    subtotal,
    "vatRate",
    "vatAmount",
    total,
    "needsConfirmation",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT ON (customer_id, year, month)
    gen_random_uuid()::TEXT,
    t.customer_id,
    t.year,
    t.month,
    t.period_start,
    t.period_end,
    t.contact,
    t.plants,
    t.subtotal,
    t.vat_rate,
    t.vat_amount,
    t.total,
    true,  -- needsConfirmation = true (draft)
    NOW(),
    NOW()
FROM temp_bang_ke_import t
WHERE t.customer_id IS NOT NULL
ORDER BY customer_id, year, month, subtotal DESC  -- Keep the one with highest subtotal
ON CONFLICT ("customerId", year, month)
DO UPDATE SET
    "periodStart" = EXCLUDED."periodStart",
    "periodEnd" = EXCLUDED."periodEnd",
    "contactName" = EXCLUDED."contactName",
    plants = EXCLUDED.plants,
    subtotal = EXCLUDED.subtotal,
    "vatAmount" = EXCLUDED."vatAmount",
    total = EXCLUDED.total,
    "needsConfirmation" = true,
    "updatedAt" = NOW();

-- ============================================================
-- STEP 6: Report import results
-- ============================================================
SELECT
    'IMPORTED/UPDATED' as status,
    COUNT(*) as count,
    SUM(subtotal) as total_subtotal,
    SUM(total) as total_with_vat
FROM temp_bang_ke_import
WHERE customer_id IS NOT NULL;

SELECT
    'SKIPPED (NO CUSTOMER MATCH)' as status,
    COUNT(*) as count,
    SUM(subtotal) as total_subtotal
FROM temp_bang_ke_import
WHERE customer_id IS NULL;

-- Cleanup
DROP TABLE IF EXISTS temp_bang_ke_import;
