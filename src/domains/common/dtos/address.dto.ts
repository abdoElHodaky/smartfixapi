/**
 * Address DTO for physical addresses
 */
export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Partial address DTO for updates
 */
export interface PartialAddressDto {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

