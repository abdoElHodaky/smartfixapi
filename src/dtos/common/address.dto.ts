import { IsString, IsOptional, Length } from 'class-validator';

/**
 * Address DTO for physical addresses
 */
export class AddressDto {
  @IsString({ message: 'Street must be a string' })
  @Length(1, 200, { message: 'Street must be between 1 and 200 characters' })
  street: string;

  @IsString({ message: 'City must be a string' })
  @Length(1, 100, { message: 'City must be between 1 and 100 characters' })
  city: string;

  @IsString({ message: 'State must be a string' })
  @Length(1, 100, { message: 'State must be between 1 and 100 characters' })
  state: string;

  @IsString({ message: 'Zip code must be a string' })
  @Length(3, 20, { message: 'Zip code must be between 3 and 20 characters' })
  zipCode: string;
}

/**
 * Partial address DTO for updates
 */
export class PartialAddressDto {
  @IsOptional()
  @IsString({ message: 'Street must be a string' })
  @Length(1, 200, { message: 'Street must be between 1 and 200 characters' })
  street?: string;

  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Length(1, 100, { message: 'City must be between 1 and 100 characters' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'State must be a string' })
  @Length(1, 100, { message: 'State must be between 1 and 100 characters' })
  state?: string;

  @IsOptional()
  @IsString({ message: 'Zip code must be a string' })
  @Length(3, 20, { message: 'Zip code must be between 3 and 20 characters' })
  zipCode?: string;
}
