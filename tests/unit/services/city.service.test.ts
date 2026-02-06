/**
 * City Service Unit Tests
 * Tests city service business logic in isolation
 *
 * Focus: Business logic validation, data transformation, city/country queries
 * Mocks: All external dependencies (database)
 */

import { prismaMock, setupTransactionMock, mockPrismaError, PRISMA_ERRORS } from '@tests/utils/prisma-mock';

// Mock external dependencies
jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

import { cityService } from '@/services/city.service';

describe('City Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  // Test data factories
  const createMockCity = (overrides = {}) => ({
    id: 1,
    name: 'taipei_city',
    name_en: 'Taipei City',
    name_zh_tw: '台北市',
    is_active: true,
    country_id: 1,
    country: {
      id: 1,
      alpha2: 'TW',
      name: 'Taiwan',
      name_en: 'Taiwan'
    },
    ...overrides
  });

  const createMockCountry = (overrides = {}) => ({
    id: 1,
    alpha2: 'TW',
    alpha3: 'TWN',
    name: 'Taiwan',
    name_en: 'Taiwan',
    ...overrides
  });

  const createMockLocation = (overrides = {}) => ({
    id: 1,
    city_id: 1,
    country_id: 1,
    isTaiwan: true,
    ...overrides
  });

  describe('getAllCitiesApi', () => {
    it('should return all active cities with default locale', async () => {
      const mockCities = [
        createMockCity({ id: 1, name: 'taipei_city' }),
        createMockCity({ id: 2, name: 'new_taipei_city', name_en: 'New Taipei City', name_zh_tw: '新北市' })
      ];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.getAllCitiesApi();

      expect(prismaMock.city.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        include: {
          country: {
            select: { alpha2: true, name: true }
          }
        },
        orderBy: [{ country_id: 'asc' }, { name: 'asc' }],
        take: 50
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].code).toBe('taipei_city');
      expect(result.data[0].name).toBe('台北市'); // default locale uses zh-TW first
    });

    it('should return cities with English names when locale is en', async () => {
      const mockCities = [createMockCity()];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.getAllCitiesApi('en');

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Taipei City');
    });

    it('should return cities with zh-TW names when locale is zh-TW', async () => {
      const mockCities = [createMockCity()];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.getAllCitiesApi('zh-TW');

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('台北市');
    });

    it('should fallback to code when no translations available', async () => {
      const mockCities = [createMockCity({
        name: 'unknown_city',
        name_en: null,
        name_zh_tw: null
      })];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.getAllCitiesApi();

      expect(result.data[0].name).toBe('unknown_city');
    });

    it('should respect limit parameter', async () => {
      prismaMock.city.findMany.mockResolvedValue([]);

      await cityService.getAllCitiesApi('default', 100);

      expect(prismaMock.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('should return empty array when no cities found', async () => {
      prismaMock.city.findMany.mockResolvedValue([]);

      const result = await cityService.getAllCitiesApi();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getCitiesByCountryApi', () => {
    it('should filter cities by country code', async () => {
      const mockCities = [createMockCity()];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.getCitiesByCountryApi('TW');

      expect(prismaMock.city.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          country: {
            alpha2: { equals: 'TW', mode: 'insensitive' }
          }
        },
        include: {
          country: {
            select: { alpha2: true, name: true }
          }
        },
        orderBy: { name: 'asc' },
        take: 50
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle case-insensitive country code', async () => {
      prismaMock.city.findMany.mockResolvedValue([createMockCity()]);

      await cityService.getCitiesByCountryApi('tw');

      expect(prismaMock.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: {
              alpha2: { equals: 'tw', mode: 'insensitive' }
            }
          })
        })
      );
    });

    it('should return empty array for non-existent country', async () => {
      prismaMock.city.findMany.mockResolvedValue([]);

      const result = await cityService.getCitiesByCountryApi('XX');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('searchCitiesApi', () => {
    it('should search cities by name', async () => {
      const mockCities = [createMockCity()];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.searchCitiesApi('taipei');

      expect(prismaMock.city.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          OR: [
            { name: { contains: 'taipei', mode: 'insensitive' } },
            { name_en: { contains: 'taipei', mode: 'insensitive' } },
            { name_zh_tw: { contains: 'taipei', mode: 'insensitive' } }
          ]
        },
        include: {
          country: {
            select: { alpha2: true, name: true }
          }
        },
        orderBy: { name: 'asc' },
        take: 20
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should search cities by Chinese name', async () => {
      const mockCities = [createMockCity()];
      prismaMock.city.findMany.mockResolvedValue(mockCities);

      const result = await cityService.searchCitiesApi('台北');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      prismaMock.city.findMany.mockResolvedValue([]);

      const result = await cityService.searchCitiesApi('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should respect custom limit', async () => {
      prismaMock.city.findMany.mockResolvedValue([]);

      await cityService.searchCitiesApi('test', 'default', 50);

      expect(prismaMock.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('getAllCountriesApi', () => {
    it('should return all countries', async () => {
      const mockCountries = [
        createMockCountry({ id: 1, alpha2: 'TW', alpha3: 'TWN', name: 'Taiwan' }),
        createMockCountry({ id: 2, alpha2: 'JP', alpha3: 'JPN', name: 'Japan', name_en: 'Japan' })
      ];
      prismaMock.country.findMany.mockResolvedValue(mockCountries);

      const result = await cityService.getAllCountriesApi();

      expect(prismaMock.country.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' }
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 1,
        code: 'TW',
        name: 'Taiwan',
        nameEn: 'Taiwan'
      });
    });

    it('should handle countries without alpha2 code', async () => {
      const mockCountries = [
        createMockCountry({ alpha2: null, alpha3: null, name: 'Unknown Country' })
      ];
      prismaMock.country.findMany.mockResolvedValue(mockCountries);

      const result = await cityService.getAllCountriesApi();

      expect(result.data[0].code).toBe('');
    });

    it('should return empty array when no countries', async () => {
      prismaMock.country.findMany.mockResolvedValue([]);

      const result = await cityService.getAllCountriesApi();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getCityByCode', () => {
    it('should return city by code', async () => {
      const mockCity = createMockCity();
      prismaMock.city.findFirst.mockResolvedValue(mockCity);

      const result = await cityService.getCityByCode('taipei_city');

      expect(prismaMock.city.findFirst).toHaveBeenCalledWith({
        where: { name: 'taipei_city' },
        include: {
          country: {
            select: { alpha2: true, name: true }
          }
        }
      });
      expect(result).not.toBeNull();
      expect(result!.code).toBe('taipei_city');
      expect(result!.countryCode).toBe('TW');
    });

    it('should return null when city not found', async () => {
      prismaMock.city.findFirst.mockResolvedValue(null);

      const result = await cityService.getCityByCode('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('validateCityCode', () => {
    it('should return true for valid active city code', async () => {
      prismaMock.city.findFirst.mockResolvedValue({ id: 1 } as any);

      const result = await cityService.validateCityCode('taipei_city');

      expect(prismaMock.city.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'taipei_city',
          is_active: true
        },
        select: { id: true }
      });
      expect(result).toBe(true);
    });

    it('should return false for non-existent city code', async () => {
      prismaMock.city.findFirst.mockResolvedValue(null);

      const result = await cityService.validateCityCode('invalid_city');

      expect(result).toBe(false);
    });

    it('should return false for inactive city', async () => {
      // findFirst with is_active: true will return null for inactive cities
      prismaMock.city.findFirst.mockResolvedValue(null);

      const result = await cityService.validateCityCode('inactive_city');

      expect(result).toBe(false);
    });
  });

  describe('findOrCreateLocation', () => {
    it('should return existing location id', async () => {
      const mockCity = createMockCity();
      const mockLocation = createMockLocation({ id: 10 });

      prismaMock.city.findFirst.mockResolvedValue(mockCity);
      prismaMock.location.findFirst.mockResolvedValue(mockLocation);

      const result = await cityService.findOrCreateLocation('taipei_city');

      expect(prismaMock.city.findFirst).toHaveBeenCalledWith({
        where: { name: 'taipei_city', is_active: true },
        include: { country: { select: { id: true } } }
      });
      expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
        where: { city_id: 1 }
      });
      expect(prismaMock.location.create).not.toHaveBeenCalled();
      expect(result).toBe(10);
    });

    it('should create new location when not exists', async () => {
      const mockCity = createMockCity();
      const mockNewLocation = createMockLocation({ id: 20 });

      prismaMock.city.findFirst.mockResolvedValue(mockCity);
      prismaMock.location.findFirst.mockResolvedValue(null);
      prismaMock.country.findUnique.mockResolvedValue(createMockCountry());
      prismaMock.location.create.mockResolvedValue(mockNewLocation);

      const result = await cityService.findOrCreateLocation('taipei_city');

      expect(prismaMock.location.create).toHaveBeenCalledWith({
        data: {
          city_id: 1,
          country_id: 1,
          isTaiwan: true
        }
      });
      expect(result).toBe(20);
    });

    it('should return null for invalid city code', async () => {
      prismaMock.city.findFirst.mockResolvedValue(null);

      const result = await cityService.findOrCreateLocation('invalid_city');

      expect(result).toBeNull();
      expect(prismaMock.location.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.location.create).not.toHaveBeenCalled();
    });

    it('should set isTaiwan to true for Taiwan cities', async () => {
      const mockCity = createMockCity({ country: { id: 1, alpha2: 'TW', name: 'Taiwan' } });

      prismaMock.city.findFirst.mockResolvedValue(mockCity);
      prismaMock.location.findFirst.mockResolvedValue(null);
      prismaMock.country.findUnique.mockResolvedValue(createMockCountry());
      prismaMock.location.create.mockResolvedValue(createMockLocation({ isTaiwan: true }));

      await cityService.findOrCreateLocation('taipei_city');

      expect(prismaMock.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isTaiwan: true })
      });
    });

    it('should set isTaiwan to false for non-Taiwan cities', async () => {
      const mockCity = createMockCity({
        country: { id: 2, alpha2: 'JP', name: 'Japan' }
      });

      prismaMock.city.findFirst.mockResolvedValue(mockCity);
      prismaMock.location.findFirst.mockResolvedValue(null);
      prismaMock.country.findUnique.mockResolvedValue(createMockCountry({ alpha2: 'JP', alpha3: 'JPN' }));
      prismaMock.location.create.mockResolvedValue(createMockLocation({ isTaiwan: false }));

      await cityService.findOrCreateLocation('tokyo');

      expect(prismaMock.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isTaiwan: false })
      });
    });

    it('should work with transaction client', async () => {
      const mockCity = createMockCity();
      const mockLocation = createMockLocation({ id: 10 });

      prismaMock.city.findFirst.mockResolvedValue(mockCity);
      prismaMock.location.findFirst.mockResolvedValue(mockLocation);

      // Pass prismaMock as transaction client
      const result = await cityService.findOrCreateLocation('taipei_city', prismaMock as any);

      expect(result).toBe(10);
    });
  });

  describe('Error handling', () => {
    it('should propagate database errors in getAllCitiesApi', async () => {
      const dbError = mockPrismaError(PRISMA_ERRORS.CONNECTION_ERROR, 'Database connection failed');
      prismaMock.city.findMany.mockRejectedValue(dbError);

      await expect(cityService.getAllCitiesApi())
        .rejects.toThrow('Database connection failed');
    });

    it('should propagate database errors in searchCitiesApi', async () => {
      const dbError = mockPrismaError(PRISMA_ERRORS.CONNECTION_ERROR, 'Database error');
      prismaMock.city.findMany.mockRejectedValue(dbError);

      await expect(cityService.searchCitiesApi('test'))
        .rejects.toThrow('Database error');
    });

    it('should propagate database errors in findOrCreateLocation', async () => {
      const dbError = mockPrismaError(PRISMA_ERRORS.CONNECTION_ERROR, 'Connection failed');
      prismaMock.city.findFirst.mockRejectedValue(dbError);

      await expect(cityService.findOrCreateLocation('taipei_city'))
        .rejects.toThrow('Connection failed');
    });
  });
});
