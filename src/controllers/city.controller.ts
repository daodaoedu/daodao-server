/**
 * 城市控制器
 * 處理城市相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { cityService, Locale } from '../services/city.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  getCitiesQuerySchema,
  getCitiesApiResponseSchema,
  getCountriesApiResponseSchema
} from '../validators/city.validators';

/**
 * 取得城市列表
 * GET /cities
 *
 * 支援參數：
 * - country: 國家代碼篩選 (ISO 3166-1 alpha-2)
 * - search: 搜尋關鍵字
 * - locale: 語系 (zh-TW, en, default)
 * - limit: 回傳數量限制
 */
export const getCities = asyncHandler(async (req: Request, res: Response) => {
  // 驗證查詢參數
  const validatedQuery = getCitiesQuerySchema.parse(req.query);
  const { country, search, locale, limit } = validatedQuery;

  let result;

  if (search) {
    // 搜尋模式
    result = await cityService.searchCitiesApi(
      search,
      locale as Locale,
      limit
    );
  } else if (country) {
    // 國家篩選模式
    result = await cityService.getCitiesByCountryApi(
      country,
      locale as Locale,
      limit
    );
  } else {
    // 全部城市
    result = await cityService.getAllCitiesApi(locale as Locale, limit);
  }

  const validatedResponse = getCitiesApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 取得國家列表
 * GET /cities/countries
 */
export const getCountries = asyncHandler(async (req: Request, res: Response) => {
  const result = await cityService.getAllCountriesApi();

  const validatedResponse = getCountriesApiResponseSchema.parse(result);
  res.json(validatedResponse);
});

/**
 * 驗證城市代碼
 * GET /cities/validate/:code
 */
export const validateCity = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const isValid = await cityService.validateCityCode(code);
  const cityData = isValid ? await cityService.getCityByCode(code) : null;

  res.json(createSuccessResponse({
    code,
    isValid,
    city: cityData
  }));
});
