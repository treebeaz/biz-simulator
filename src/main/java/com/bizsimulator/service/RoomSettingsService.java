package com.bizsimulator.service;

import com.bizsimulator.dto.room.RoomSettingsDto;
import com.bizsimulator.dto.room.UpdateRoomSettingsRequestDto;
import com.bizsimulator.entity.room.RoomSettings;
import com.bizsimulator.exception.room.RoomSettingsNotFoundException;
import com.bizsimulator.mapper.RoomSettingsMapper;
import com.bizsimulator.repository.room.RoomSettingsRepository;
import com.bizsimulator.util.DefaultSettingsProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomSettingsService {
    private final DefaultSettingsProvider defaultSettingsProvider;
    private final RoomSettingsRepository roomSettingsRepository;
    private final RoomSettingsMapper mapper;

    /**
     * Создать настройки с дефолт-значениями для комнаты-кофейни.
     *
     * @param roomId
     * @param startCash
     */
    @Transactional
    public void createCoffeeShopSettings(UUID roomId, BigDecimal startCash) {
        RoomSettings roomSettings = defaultSettingsProvider.getForCoffeeShop(roomId, startCash);
        roomSettingsRepository.save(roomSettings);
        log.info("RoomSettingsService.createCoffeeShopSettings.Success: Default settings applied to the room {}", roomId);
    }


    /**
     * Получить настройки комнаты по roomId.
     *
     * @param roomId
     * @return RoomSettingsDto
     */
    public RoomSettingsDto getSettingsByRoomId(UUID roomId) {
        RoomSettings roomSettings = roomSettingsRepository.findByRoomId(roomId)
                .orElseThrow(() -> {
                    log.error("RoomSettingsService.getSettingsByRoomId.Error: Room settings by id {} not found ", roomId);
                    return new RoomSettingsNotFoundException("Room settings not found");
                });
        return mapper.toRoomSettingsDto(roomSettings);
    }

    public RoomSettingsDto updateSettings(UUID roomId,
                                          UpdateRoomSettingsRequestDto requestDto) {
        RoomSettings roomSettings = roomSettingsRepository.findByRoomId(roomId)
                .orElseThrow(() -> {
                    log.error("RoomSettingsService.updateSettings.Error: Room settings by id {} not found ", roomId);
                    return new RoomSettingsNotFoundException("Room settings not found");
                });
        mapper.updateRoomSettingsFromDto(requestDto, roomSettings);
        RoomSettings updateSettings = roomSettingsRepository.save(roomSettings);

        return mapper.toRoomSettingsDto(updateSettings);
    }


}
