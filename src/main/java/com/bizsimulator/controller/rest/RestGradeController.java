package com.bizsimulator.controller.rest;

import com.bizsimulator.dto.simulation.StudentGradeDto;
import com.bizsimulator.dto.simulation.UpsertStudentGradeRequestDto;
import com.bizsimulator.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("api/grades")
@RequiredArgsConstructor
public class RestGradeController {

    private final GradeService gradeService;

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/rooms/{roomId}/students/{studentId}")
    public ResponseEntity<StudentGradeDto> getGrades(@PathVariable UUID roomId,
                                                     @PathVariable UUID studentId,
                                                     Authentication authentication) {
        return gradeService.getGrade(roomId, studentId, authentication)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/rooms/{roomId}/students/{studentId}")
    public ResponseEntity<StudentGradeDto> upsert(@PathVariable UUID roomId,
                                                  @PathVariable UUID studentId,
                                                  @Valid @RequestBody UpsertStudentGradeRequestDto request,
                                                  Authentication authentication) {
        return ResponseEntity.ok(gradeService.upsertGrade(roomId, studentId, request, authentication));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/rooms/{roomId}/me")
    public ResponseEntity<StudentGradeDto> getMyGrade(@PathVariable UUID roomId,
                                                      Authentication authentication) {
        return gradeService.getMyGrade(roomId, authentication)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
