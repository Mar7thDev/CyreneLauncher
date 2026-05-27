PROTO_SRC=./proto
GEN_DEST=./pkg

proto:
	@echo Compiling Protobuf files...
	protoc --go_out=${GEN_DEST} --go-grpc_out=${GEN_DEST} ${PROTO_SRC}/*.proto
	@echo Done!

icon:
	@echo Updating icons...
	magick build/appicon.png -define icon:auto-resize=16,24,32,48,64,128,256 build/windows/icon.ico
	magick build/appicon.png -define icon:auto-resize=16,24,32,48,64,128,256,512 build/windows/icons.ico
	@echo Done!

dev:
	@echo Starting development server...
	wails3 dev
	@echo Done!

build:
	@echo Building application...
	wails3 build
	@echo Done!

generate:
	@echo Generating bindings...
	wails3 generate bindings -ts
	@echo Done!

release:
	@echo Building release application...
	wails3 package
	@echo Done!

update:
	@echo Updating build assets...
	wails3 update build-assets -name "cyrene-launcher" -binaryname "cyrene-launcher" -config build/config.yml
	@echo Done!

