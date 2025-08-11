import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRegistrationDto } from './user-registration.dto';
import { ServiceProviderRegistrationDto } from './provider-registration.dto';

/**
 * Combined DTO for provider registration (user + provider data)
 */
export class ProviderUserRegistrationDto {
  @ValidateNested()
  @Type(() => UserRegistrationDto)
  userData: UserRegistrationDto;

  @ValidateNested()
  @Type(() => ServiceProviderRegistrationDto)
  providerData: ServiceProviderRegistrationDto;
}
