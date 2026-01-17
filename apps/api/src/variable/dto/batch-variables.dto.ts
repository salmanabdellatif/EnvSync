import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsDefined,
  IsString,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariableDto } from './create-variable.dto';

export class BatchVariableChangesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariableDto)
  @ArrayMaxSize(500)
  creates?: CreateVariableDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariableDto)
  @ArrayMaxSize(500)
  updates?: CreateVariableDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  deletes?: string[];
}

export class BatchVariablesDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BatchVariableChangesDto)
  changes: BatchVariableChangesDto;
}
