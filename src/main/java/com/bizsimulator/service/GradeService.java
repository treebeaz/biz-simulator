package com.bizsimulator.service;

import com.bizsimulator.dto.simulation.StudentGradeDto;
import com.bizsimulator.dto.simulation.UpsertStudentGradeRequestDto;
import com.bizsimulator.entity.room.Room;
import com.bizsimulator.entity.simulation.StudentGrade;
import com.bizsimulator.entity.user.User;
import com.bizsimulator.exception.room.RoomNotFoundException;
import com.bizsimulator.exception.room.RoomWithTeacherIdDoesNotExistsException;
import com.bizsimulator.repository.room.RoomRepository;
import com.bizsimulator.repository.simulation.StudentGradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeService {

    private final StudentGradeRepository studentGradeRepository;
    private final RoomRepository roomRepository;

    private final UserService userService;

    public Optional<StudentGradeDto> getGrade(UUID roomId,
                                              UUID studentId,
                                              Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("GradeService.getGrade.Error: Room {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if(!room.getTeacherId().equals(teacher.getId())) {
            log.error("GradeService.getGrade.Error: Room {} with teacher {} doesn't exists", roomId, teacher.getId());
            throw new RoomWithTeacherIdDoesNotExistsException("Room with teacher doesn't exists");
        }

        return studentGradeRepository.findByRoomIdAndStudentId(roomId, studentId)
                .map(this::toDto);
    }

    private StudentGradeDto toDto(StudentGrade studentGrade) {
        return StudentGradeDto.builder()
                .roomId(studentGrade.getRoomId())
                .studentId(studentGrade.getStudentId())
                .gradeValue(studentGrade.getGradeValue())
                .comment(studentGrade.getComment())
                .updatedAt(studentGrade.getUpdatedAt())
                .build();
    }

    @Transactional
    public StudentGradeDto upsertGrade(UUID roomId,
                                       UUID studentId,
                                       UpsertStudentGradeRequestDto requestDto,
                                       Authentication authentication) {
        User teacher = userService.getCurrentAuthenticationUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> {
                    log.error("GradeService.upsertGrade.Error: Room {} not found", roomId);
                    return new RoomNotFoundException("Room not found");
                });
        if(!room.getTeacherId().equals(teacher.getId())) {
            log.error("GradeService.upsertGrade.Error: Room {} with teacher {} doesn't exists", roomId, teacher.getId());
            throw new RoomWithTeacherIdDoesNotExistsException("Room with teacher doesn't exists");
        }

        StudentGrade grade = studentGradeRepository.findByRoomIdAndStudentId(roomId, studentId)
                .orElse(StudentGrade.builder()
                        .roomId(roomId)
                        .teacherId(teacher.getId())
                        .studentId(studentId)
                        .build());

        grade.setGradeValue(requestDto.getGradeValue());
        grade.setComment(requestDto.getComment());

        StudentGrade saved =  studentGradeRepository.save(grade);
        return toDto(saved);
    }

    public Optional<StudentGradeDto> getMyGrade(UUID roomId, Authentication authentication) {
        User student = userService.getCurrentAuthenticationUser(authentication);

        return studentGradeRepository.findByRoomIdAndStudentId(roomId, student.getId())
                .map(this::toDto);
    }
}
