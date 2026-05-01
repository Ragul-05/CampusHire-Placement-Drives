package com.example.backend.DTOs.Offers;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OfferFilterResponseDTO {
    private OfferFilterSummaryDTO summary;
    private List<OfferFilterRowDTO> rows;
}
