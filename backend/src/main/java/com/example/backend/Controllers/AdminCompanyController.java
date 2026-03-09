package com.example.backend.Controllers;

import com.example.backend.AOPs.AuditAction;
import com.example.backend.DTOs.Admin.CompanyRequestDTO;
import com.example.backend.DTOs.Admin.CompanyResponseDTO;
import com.example.backend.Services.AdminCompanyService;
import com.example.backend.Utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/companies")
public class AdminCompanyController {

    @Autowired
    private AdminCompanyService companyService;

    @PostMapping
    @AuditAction(action = "ADD_COMPANY", targetEntity = "Company")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> addCompany(
            @RequestParam(required = false) String email,
            @Valid @RequestBody CompanyRequestDTO dto) {
        CompanyResponseDTO response = companyService.addCompany(dto);
        return ResponseEntity.ok(ApiResponse.success("Company added successfully", response));
    }

    @PutMapping("/{companyId}")
    @AuditAction(action = "UPDATE_COMPANY", targetEntity = "Company")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> updateCompany(
            @RequestParam(required = false) String email,
            @PathVariable Long companyId,
            @Valid @RequestBody CompanyRequestDTO dto) {
        CompanyResponseDTO response = companyService.updateCompany(companyId, dto);
        return ResponseEntity.ok(ApiResponse.success("Company updated successfully", response));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> getCompanyById(@PathVariable Long companyId) {
        return ResponseEntity
                .ok(ApiResponse.success("Company fetched successfully", companyService.getCompanyById(companyId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getAllCompanies() {
        return ResponseEntity
                .ok(ApiResponse.success("Companies fetched successfully", companyService.getAllCompanies()));
    }

    @DeleteMapping("/{companyId}")
    @AuditAction(action = "DELETE_COMPANY", targetEntity = "Company")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(
            @RequestParam(required = false) String email,
            @PathVariable Long companyId) {
        companyService.deleteCompany(companyId);
        return ResponseEntity.ok(ApiResponse.success("Company deleted successfully", null));
    }
}
