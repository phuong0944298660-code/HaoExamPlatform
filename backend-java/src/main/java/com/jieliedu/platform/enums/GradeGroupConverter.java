package com.jieliedu.platform.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA Converter for GradeGroup to handle case-insensitive database values
 */
@Converter(autoApply = true)
public class GradeGroupConverter implements AttributeConverter<GradeGroup, String> {
    
    @Override
    public String convertToDatabaseColumn(GradeGroup attribute) {
        return attribute != null ? attribute.getCode() : null;
    }

    @Override
    public GradeGroup convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        // Use GradeGroup.fromCode which is case-insensitive and robust
        return GradeGroup.fromCode(dbData);
    }
}
