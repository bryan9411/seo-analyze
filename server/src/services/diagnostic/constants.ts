/**
 * 程式內建的正規表示式 (台灣在地格式，較少隨搜尋引擎規則變動)
 * 會隨搜尋引擎調整的字詞庫與門檻值請改 server/rules/rules.json
 */

/**
 * 台灣電話格式正規表示式 (支援市話 02/04/07、手機 09xx、免付費電話 0800)
 * 前後不可緊接數字，避免把商品編號、訂單號誤判為電話
 */
export const TAIWAN_PHONE_REGEX =
  /(?<!\d)(?:(?:0800[-–\s]?\d{3}[-–\s]?\d{3})|(?:09\d{2}[-–\s]?\d{3}[-–\s]?\d{3})|(?:\(?0\d{1,2}\)?[-–\s]?\d{3,4}[-–\s]?\d{4}))(?!\d)/g

/**
 * 台灣縣市名稱清單 (含標準與台/臺字元)
 */
export const TAIWAN_COUNTIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
  '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市',
  '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣',
  '臺北市', '臺中市', '臺南市', '臺東縣'
]

/**
 * 台灣實體地址正規表示式 (縣市開頭、號結尾)
 */
export const TAIWAN_ADDRESS_REGEX = new RegExp(
  `(?:${TAIWAN_COUNTIES.join('|')})[^\\s<>，。、；|]{2,30}?\\d+(?:之\\d+)?號`,
  'g'
)

/** Schema.org LocalBusiness 及常見子類型 */
export const LOCAL_BUSINESS_TYPE_REGEX =
  /LocalBusiness|Restaurant|Store|Dentist|Physician|MedicalClinic|MedicalBusiness|AutoRepair|AutomotiveBusiness|HomeAndConstructionBusiness|LegalService|FinancialService|LodgingBusiness|Hotel|BeautySalon|HealthAndBeautyBusiness|FoodEstablishment|ProfessionalService|RealEstateAgent|TravelAgency/i

/** SPA 常見的掛載根節點 */
export const APP_ROOT_SELECTOR = '#root, #app, #__next, #__nuxt, [data-reactroot], [ng-version], app-root'
